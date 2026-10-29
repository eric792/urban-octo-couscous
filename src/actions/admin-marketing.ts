"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/types";

const optionalNumber = z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().min(0).optional());

const discountSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Codes use 3–30 letters, numbers, - or _"),
    description: z.string().trim().max(160).optional(),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
    value: optionalNumber,
    minSubtotal: optionalNumber,
    maxUses: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(1).optional()),
    expiresAt: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
  })
  .refine((d) => d.type === "FREE_SHIPPING" || (d.value ?? 0) > 0, { message: "Enter the discount value", path: ["value"] })
  .refine((d) => d.type !== "PERCENTAGE" || (d.value ?? 0) <= 100, { message: "A percentage can't be more than 100", path: ["value"] });

export async function createDiscount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = discountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  try {
    await db.discountCode.create({
      data: {
        code: d.code,
        description: d.description || null,
        type: d.type,
        value: d.type === "FREE_SHIPPING" ? 0 : d.value ?? 0,
        minSubtotal: d.minSubtotal ?? null,
        maxUses: d.maxUses ?? null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt.setHours(23, 59, 59, 999)) : null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, message: `${d.code} already exists.` };
    }
    throw err;
  }
  revalidatePath("/admin/marketing");
  return { ok: true, message: `${d.code} created` };
}

export async function toggleDiscount(id: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const d = await db.discountCode.findUnique({ where: { id } });
  if (!d) return { ok: false, message: "Not found" };
  await db.discountCode.update({ where: { id }, data: { active: !d.active } });
  revalidatePath("/admin/marketing");
  return { ok: true };
}

export async function deleteDiscount(id: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdmin();
  await db.discountCode.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/marketing");
  return { ok: true };
}
