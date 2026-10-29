"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/types";

const postSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(160),
  slug: z.string().trim().max(80).optional(),
  excerpt: z.string().trim().min(10, "Write a short excerpt (shown in previews and Google)").max(300),
  coverImage: z.string().trim().min(1, "Add a cover image URL").max(500).refine((s) => s.startsWith("/") || s.startsWith("https://"), "Cover image must start with https:// or /"),
  content: z.string().trim().min(20, "Write the article").max(50_000),
  published: z.boolean(),
});

function refresh(slug?: string) {
  revalidateTag("blog");
  revalidatePath("/admin/journal");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function savePost(postId: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    excerpt: formData.get("excerpt"),
    coverImage: formData.get("coverImage"),
    content: formData.get("content"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { slug: rawSlug, ...data } = parsed.data;
  const slug = slugify(rawSlug || data.title);

  const taken = await db.blogPost.findFirst({ where: { slug, ...(postId && { id: { not: postId } }) }, select: { id: true } });
  if (taken) return { ok: false, message: `The URL /blog/${slug} is already used.` };

  if (!postId) {
    const created = await db.blogPost.create({ data: { ...data, slug } });
    refresh(slug);
    redirect(`/admin/journal/${created.id}?saved=1`);
  }
  await db.blogPost.update({ where: { id: postId }, data: { ...data, slug } });
  refresh(slug);
  return { ok: true, message: data.published ? "Saved & published" : "Draft saved" };
}

export async function deletePost(postId: string, _prev: ActionState, _formData: FormData): Promise<ActionState> {
  await requireAdmin();
  await db.blogPost.delete({ where: { id: postId } }).catch(() => undefined);
  refresh();
  redirect("/admin/journal");
}
