import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { saveCategory } from "@/actions/admin-categories";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { db } from "@/lib/db";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <Link href="/admin/inventory" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Inventory
      </Link>
      <AdminHeader eyebrow="Inventory" title="Category pages" />
      <p className="-mt-4 mb-8 max-w-3xl text-sm text-zinc-400">
        Each category page shows its heading and intro above the products and the guide copy below them. A{" "}
        <code className="text-gold-300">## Frequently asked questions</code> section with <code className="text-gold-300">### Question</code>{" "}
        headings is also sent to Google as FAQ structured data.
      </p>

      <div className="max-w-4xl space-y-6">
        {categories.map((c) => (
          <section key={c.id} className="admin-card p-6">
            <div className="mb-5 flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-medium text-white">{c.name}</h2>
              <Link href={`/shop/${c.slug}`} target="_blank" className="text-xs text-zinc-500 hover:text-white">/shop/{c.slug} ↗</Link>
            </div>
            <ActionForm action={saveCategory.bind(null, c.id)} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="admin-label" htmlFor={`heading-${c.id}`}>Page heading (H1)</label>
                <input id={`heading-${c.id}`} name="heading" defaultValue={c.heading ?? ""} placeholder={c.name} className="admin-input" />
              </div>
              <div>
                <label className="admin-label" htmlFor={`seoTitle-${c.id}`}>SEO title</label>
                <input id={`seoTitle-${c.id}`} name="seoTitle" maxLength={70} defaultValue={c.seoTitle ?? ""} placeholder={`${c.name} | Zen Amour`} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label" htmlFor={`seoDescription-${c.id}`}>Meta description</label>
                <input id={`seoDescription-${c.id}`} name="seoDescription" maxLength={170} defaultValue={c.seoDescription ?? ""} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label" htmlFor={`description-${c.id}`}>Intro (above products)</label>
                <textarea id={`description-${c.id}`} name="description" rows={2} maxLength={300} defaultValue={c.description ?? ""} className="admin-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label" htmlFor={`content-${c.id}`}>Guide &amp; FAQ (below products, Markdown)</label>
                <textarea id={`content-${c.id}`} name="content" rows={14} defaultValue={c.content ?? ""} className="admin-input font-mono text-[13px] leading-relaxed" />
              </div>
              <div className="flex justify-end sm:col-span-2">
                <SubmitButton variant="admin" pendingText="Saving…">Save {c.name}</SubmitButton>
              </div>
            </ActionForm>
          </section>
        ))}
      </div>
    </>
  );
}
