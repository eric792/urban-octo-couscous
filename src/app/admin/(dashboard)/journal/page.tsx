import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Journal" };

export default async function AdminJournalPage() {
  const posts = await db.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <AdminHeader eyebrow="SEO Journal & Guides" title="Journal">
        <Link href="/admin/journal/new" className="admin-btn"><Plus className="h-4 w-4" /> New post</Link>
      </AdminHeader>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-400">
              <th className="px-5 py-4">Title</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Updated</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {posts.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    variant="admin"
                    icon={BookOpen}
                    title="No posts yet"
                    description="Guides on scent, skincare and rituals build search traffic over time."
                    action={{ label: "Write your first guide", href: "/admin/journal/new" }}
                  />
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-900/60">
                <td className="px-5 py-4">
                  <Link href={`/admin/journal/${p.id}`} className="font-medium text-white hover:text-gold-300">{p.title}</Link>
                  <p className="text-xs text-zinc-500">/blog/{p.slug}</p>
                </td>
                <td className="px-5 py-4">{p.published ? <Badge tone="green">Published</Badge> : <Badge tone="zinc">Draft</Badge>}</td>
                <td className="px-5 py-4 text-zinc-400">{formatDate(p.updatedAt)}</td>
                <td className="px-5 py-4 text-right">
                  {p.published && <Link href={`/blog/${p.slug}`} target="_blank" className="text-xs text-zinc-500 hover:text-white">View ↗</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
