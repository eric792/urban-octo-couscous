import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deletePost } from "@/actions/admin-blog";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { db } from "@/lib/db";

export const metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <>
      <Link href="/admin/journal" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Journal
      </Link>
      <AdminHeader eyebrow="Journal" title={post.title}>
        {post.published && <Link href={`/blog/${post.slug}`} target="_blank" className="admin-btn-secondary">View post ↗</Link>}
      </AdminHeader>
      <PostForm
        saved={saved === "1"}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          coverImage: post.coverImage,
          content: post.content,
          published: post.published,
        }}
      />
      <div className="mt-10 border-t border-zinc-800 pt-6">
        <ActionForm action={deletePost.bind(null, post.id)} confirmText={`Delete "${post.title}"?`}>
          <SubmitButton variant="danger"><Trash2 className="h-4 w-4" /> Delete post</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
