"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/types";

const money = z.coerce.number().min(0, "Price can't be negative").max(1_000_000);

const variantSchema = z.object({
  id: z.string().max(64).optional(),
  sku: z.string().trim().min(2, "Each size needs a SKU").max(40).transform((s) => s.toUpperCase()),
  volume: z.string().trim().max(40).optional(),
  price: money.refine((v) => v > 0, "Price must be more than R0"),
  comparePrice: z.union([money, z.literal(""), z.null()]).optional(),
  stock: z.coerce.number().int().min(0).max(100_000),
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z.string().trim().max(80).optional(),
  categoryId: z.string().min(1, "Choose a category"),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().min(10, "Write a short description").max(5000),
  scentNotes: z.string().trim().max(400).optional(),
  concentration: z.string().trim().max(60).optional(),
  scentFamily: z.string().trim().max(60).optional(),
  inspiredBy: z.string().trim().max(120).optional(),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
  images: z
    .array(z.string().trim().max(500).refine((s) => s.startsWith("/") || /^https:\/\//.test(s), "Image URLs must start with https:// or /"))
    .max(10),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  variants: z.array(variantSchema).min(1, "Add at least one size / variant").max(12),
});

function refresh(productId?: string) {
  revalidateTag("catalog");
  revalidatePath("/admin/inventory");
  if (productId) revalidatePath(`/admin/inventory/${productId}`);
}

export async function saveProduct(productId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  let variantsRaw: unknown = [];
  try {
    variantsRaw = JSON.parse(String(formData.get("variants") ?? "[]"));
  } catch {
    return { ok: false, message: "Variants could not be read." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    categoryId: formData.get("categoryId"),
    tagline: formData.get("tagline") || undefined,
    description: formData.get("description"),
    scentNotes: formData.get("scentNotes") || undefined,
    concentration: formData.get("concentration") || undefined,
    scentFamily: formData.get("scentFamily") || undefined,
    inspiredBy: formData.get("inspiredBy") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    images: String(formData.get("images") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    variants: variantsRaw,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const data = parsed.data;
  const slug = slugify(data.slug || data.name);
  if (!slug) return { ok: false, message: "Enter a valid name or URL slug." };

  const skus = data.variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) return { ok: false, message: "Each variant needs a unique SKU." };

  const [slugTaken, skuTaken] = await Promise.all([
    db.product.findFirst({ where: { slug, ...(productId && { id: { not: productId } }) }, select: { id: true } }),
    db.productVariant.findFirst({
      where: { sku: { in: skus }, ...(productId && { productId: { not: productId } }) },
      select: { sku: true },
    }),
  ]);
  if (slugTaken) return { ok: false, message: `The URL "/product/${slug}" is already used by another product.` };
  if (skuTaken) return { ok: false, message: `SKU ${skuTaken.sku} is already used by another product.` };

  const productData = {
    name: data.name,
    slug,
    categoryId: data.categoryId,
    tagline: data.tagline ?? null,
    description: data.description,
    scentNotes: data.scentNotes ?? null,
    concentration: data.concentration ?? null,
    scentFamily: data.scentFamily ?? null,
    inspiredBy: data.inspiredBy ?? null,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
    images: data.images,
    isFeatured: data.isFeatured,
    isActive: data.isActive,
  };
  const variantData = (v: z.infer<typeof variantSchema>, i: number) => ({
    sku: v.sku,
    volume: v.volume || null,
    price: v.price,
    comparePrice: typeof v.comparePrice === "number" && v.comparePrice > 0 ? v.comparePrice : null,
    stock: v.stock,
    sortOrder: i,
  });

  if (!productId) {
    const created = await db.product.create({
      data: { ...productData, variants: { create: data.variants.map(variantData) } },
    });
    refresh(created.id);
    redirect(`/admin/inventory/${created.id}?saved=1`);
  }

  const existing = await db.productVariant.findMany({
    where: { productId },
    select: { id: true, sku: true, _count: { select: { orderItems: true } } },
  });
  const keepIds = new Set(data.variants.map((v) => v.id).filter(Boolean));
  const removed = existing.filter((v) => !keepIds.has(v.id));
  const blocked = removed.find((v) => v._count.orderItems > 0);
  if (blocked) {
    return { ok: false, message: `${blocked.sku} has past orders and can't be deleted — set its stock to 0 instead.` };
  }

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: productId }, data: productData });
    if (removed.length) await tx.productVariant.deleteMany({ where: { id: { in: removed.map((v) => v.id) } } });
    // Free up SKUs first so swapping SKUs between rows can't collide.
    for (const [i, v] of data.variants.entries()) {
      if (v.id && existing.some((e) => e.id === v.id)) {
        await tx.productVariant.update({ where: { id: v.id }, data: { sku: `__tmp_${v.id}_${i}` } });
      }
    }
    for (const [i, v] of data.variants.entries()) {
      if (v.id && existing.some((e) => e.id === v.id)) {
        await tx.productVariant.update({ where: { id: v.id }, data: variantData(v, i) });
      } else {
        await tx.productVariant.create({ data: { ...variantData(v, i), productId } });
      }
    }
  }, { maxWait: 5_000, timeout: 15_000 });

  refresh(productId);
  return { ok: true, message: "Product saved" };
}

export async function updateStock(variantId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const stock = z.coerce.number().int().min(0).max(100_000).safeParse(formData.get("stock"));
  if (!stock.success) return { ok: false, message: "Enter a whole number" };
  const v = await db.productVariant.update({ where: { id: variantId }, data: { stock: stock.data } });
  refresh(v.productId);
  return { ok: true, message: "Saved" };
}

export async function toggleProductActive(productId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const p = await db.product.findUnique({ where: { id: productId }, select: { isActive: true } });
  if (!p) return { ok: false, message: "Product not found" };
  await db.product.update({ where: { id: productId }, data: { isActive: !p.isActive } });
  refresh(productId);
  return { ok: true, message: p.isActive ? "Hidden from store" : "Visible in store" };
}

export async function deleteProduct(productId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const orders = await db.orderItem.count({ where: { variant: { productId } } });
  if (orders > 0) {
    return { ok: false, message: "This product has past orders, so it can't be deleted. Hide it from the store instead." };
  }
  await db.product.delete({ where: { id: productId } });
  refresh();
  redirect("/admin/inventory");
}
