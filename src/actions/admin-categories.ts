"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/types";

const blankToNull = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v), z.string().max(max).nullable());

const schema = z.object({
  description: blankToNull(300),
  heading: blankToNull(80),
  seoTitle: blankToNull(70),
  seoDescription: blankToNull(170),
  content: blankToNull(20_000),
});

export async function saveCategory(categoryId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const category = await db.category.update({ where: { id: categoryId }, data: parsed.data });
  revalidateTag("catalog");
  revalidatePath(`/shop/${category.slug}`);
  revalidatePath("/admin/inventory/categories");
  return { ok: true, message: `${category.name} saved` };
}
