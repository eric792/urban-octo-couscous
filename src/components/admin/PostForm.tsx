"use client";

import { useActionState, useState } from "react";
import { savePost } from "@/actions/admin-blog";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/types";

export interface PostFormValues {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  content: string;
  published: boolean;
}

export function PostForm({ initial, saved }: { initial: PostFormValues; saved?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(savePost.bind(null, initial.id), {
    ok: Boolean(saved),
    message: saved ? "Post created" : undefined,
  });
  // Controlled so a validation error never wipes the draft.
  const [v, setV] = useState(initial);
  const set = (key: keyof PostFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((prev) => ({ ...prev, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="admin-card space-y-5 p-6">
          <div>
            <label className="admin-label" htmlFor="title">Title</label>
            <input id="title" name="title" value={v.title} onChange={set("title")} className="admin-input text-lg" />
          </div>
          <div>
            <label className="admin-label" htmlFor="excerpt">Excerpt</label>
            <textarea id="excerpt" name="excerpt" rows={2} value={v.excerpt} onChange={set("excerpt")} className="admin-input" />
          </div>
          <div>
            <label className="admin-label" htmlFor="content">Article</label>
            <textarea id="content" name="content" rows={22} value={v.content} onChange={set("content")} className="admin-input font-mono text-[13px] leading-relaxed" />
            <p className="mt-2 text-xs text-zinc-600">
              Formatting: <code>## Heading</code>, <code>### Subheading</code>, <code>- list item</code>, <code>&gt; quote</code>, <code>**bold**</code>, <code>*italic*</code>, <code>[link text](/product/oud-royale)</code>. Leave a blank line between paragraphs.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="admin-card space-y-5 p-6">
          <div>
            <label className="admin-label" htmlFor="slug">URL slug</label>
            <input id="slug" name="slug" value={v.slug} placeholder={slugify(v.title)} onChange={set("slug")} className="admin-input font-mono" />
            <p className="mt-1 text-xs text-zinc-600">/blog/{slugify(v.slug || v.title) || "…"}</p>
          </div>
          <div>
            <label className="admin-label" htmlFor="coverImage">Cover image URL</label>
            <input id="coverImage" name="coverImage" value={v.coverImage} onChange={set("coverImage")} placeholder="https://res.cloudinary.com/…" className="admin-input font-mono text-xs" />
          </div>
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <input type="checkbox" name="published" checked={v.published} onChange={set("published")} className="h-4 w-4 accent-gold-500" />
            Published
          </label>
        </div>
        <div className="admin-card sticky top-6 p-6">
          <SubmitButton variant="admin" className="w-full" pendingText="Saving…">{initial.id ? "Save post" : "Create post"}</SubmitButton>
          {state.message && <p className={`mt-3 text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>}
        </div>
      </div>
    </form>
  );
}
