import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";

export const metadata = { title: "New post" };

export default function NewPostPage() {
  return (
    <>
      <Link href="/admin/journal" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Journal
      </Link>
      <AdminHeader eyebrow="Journal" title="New post" />
      <PostForm initial={{ id: null, title: "", slug: "", excerpt: "", coverImage: "", content: "", published: false }} />
    </>
  );
}
