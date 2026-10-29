"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct } from "@/actions/admin-products";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { slugify } from "@/lib/utils";
import type { ActionState } from "@/types";

export interface ProductFormValues {
  id: string | null;
  name: string;
  slug: string;
  categoryId: string;
  tagline: string;
  description: string;
  scentNotes: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  variants: { id?: string; sku: string; volume: string; price: string; comparePrice: string; stock: string }[];
}

export function ProductForm({
  initial,
  categories,
  saved,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  saved?: boolean;
}) {
  const [state, action] = useActionState<ActionState, FormData>(saveProduct.bind(null, initial.id), {
    ok: Boolean(saved),
    message: saved ? "Product created" : undefined,
  });
  // Every field is controlled: React 19 resets uncontrolled inputs after a form
  // action, which would wipe unsaved edits when the server returns an error.
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [tagline, setTagline] = useState(initial.tagline);
  const [description, setDescription] = useState(initial.description);
  const [scentNotes, setScentNotes] = useState(initial.scentNotes);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [images, setImages] = useState(initial.images.join("\n"));
  const [isActive, setIsActive] = useState(initial.isActive);
  const [isFeatured, setIsFeatured] = useState(initial.isFeatured);
  const [variants, setVariants] = useState(initial.variants);

  const update = (i: number, key: keyof ProductFormValues["variants"][number], value: string) =>
    setVariants((rows) => rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-3">
      <input type="hidden" name="variants" value={JSON.stringify(variants)} />

      <div className="space-y-6 lg:col-span-2">
        <section className="admin-card space-y-5 p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="admin-label" htmlFor="name">Product name</label>
              <input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className="admin-input" />
            </div>
            <div>
              <label className="admin-label" htmlFor="slug">URL slug</label>
              <input id="slug" name="slug" value={slug} placeholder={slugify(name)} onChange={(e) => setSlug(e.target.value)} className="admin-input font-mono" />
              <p className="mt-1 text-xs text-zinc-600">/product/{slugify(slug || name) || "…"}</p>
            </div>
          </div>
          <div>
            <label className="admin-label" htmlFor="tagline">Tagline</label>
            <input id="tagline" name="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Smoked oud, saffron & rose" className="admin-input" />
          </div>
          <div>
            <label className="admin-label" htmlFor="description">Description</label>
            <textarea id="description" name="description" required rows={7} value={description} onChange={(e) => setDescription(e.target.value)} className="admin-input" />
            <p className="mt-1 text-xs text-zinc-600">Leave a blank line between paragraphs.</p>
          </div>
          <div>
            <label className="admin-label" htmlFor="scentNotes">Scent notes (fragrances)</label>
            <input id="scentNotes" name="scentNotes" value={scentNotes} onChange={(e) => setScentNotes(e.target.value)} placeholder="Top: Bergamot | Heart: Amber | Base: Oud" className="admin-input" />
          </div>
        </section>

        <section className="admin-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium text-white">Sizes, pricing &amp; stock</h2>
            <button
              type="button"
              onClick={() => setVariants((rows) => [...rows, { sku: "", volume: "", price: "", comparePrice: "", stock: "0" }])}
              className="admin-btn-secondary py-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add size
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
                  <th className="pb-2 pr-2">SKU</th>
                  <th className="pb-2 pr-2">Size / volume</th>
                  <th className="pb-2 pr-2">Price (R)</th>
                  <th className="pb-2 pr-2">Was (R)</th>
                  <th className="pb-2 pr-2">Stock</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {variants.map((v, i) => (
                  <tr key={v.id ?? `new-${i}`}>
                    <td className="py-1 pr-2"><input aria-label="SKU" value={v.sku} onChange={(e) => update(i, "sku", e.target.value)} className="admin-input py-2 font-mono uppercase" placeholder="ZA-OUD-50ML" /></td>
                    <td className="py-1 pr-2"><input aria-label="Size" value={v.volume} onChange={(e) => update(i, "volume", e.target.value)} className="admin-input py-2" placeholder="50ml" /></td>
                    <td className="py-1 pr-2"><input aria-label="Price" type="number" min="0" step="0.01" value={v.price} onChange={(e) => update(i, "price", e.target.value)} className="admin-input py-2" /></td>
                    <td className="py-1 pr-2"><input aria-label="Compare-at price" type="number" min="0" step="0.01" value={v.comparePrice} onChange={(e) => update(i, "comparePrice", e.target.value)} className="admin-input py-2" placeholder="—" /></td>
                    <td className="py-1 pr-2"><input aria-label="Stock" type="number" min="0" step="1" value={v.stock} onChange={(e) => update(i, "stock", e.target.value)} className="admin-input py-2" /></td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => setVariants((rows) => rows.filter((_, idx) => idx !== i))}
                        disabled={variants.length === 1}
                        className="p-2 text-zinc-500 hover:text-rose-300 disabled:opacity-30"
                        aria-label="Remove size"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-600">&ldquo;Was&rdquo; price shows a strike-through sale price on the store.</p>
        </section>
      </div>

      <div className="space-y-6">
        <section className="admin-card space-y-5 p-6">
          <div>
            <label className="admin-label" htmlFor="categoryId">Category</label>
            <select id="categoryId" name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="admin-input">
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <input type="checkbox" name="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-gold-500" />
            Visible in store
          </label>
          <label className="flex items-center gap-3 text-sm text-zinc-300">
            <input type="checkbox" name="isFeatured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 accent-gold-500" />
            Feature on homepage
          </label>
        </section>

        <section className="admin-card p-6">
          <label className="admin-label" htmlFor="images">Image URLs</label>
          <textarea
            id="images"
            name="images"
            rows={5}
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder={"https://res.cloudinary.com/…/oud.jpg\n/images/products/oud-royale.svg"}
            className="admin-input font-mono text-xs"
          />
          <p className="mt-2 text-xs text-zinc-600">One per line. The first image is the main photo. Upload to Cloudinary or S3 and paste the link.</p>
        </section>

        <div className="admin-card sticky top-6 p-6">
          <SubmitButton variant="admin" className="w-full" pendingText="Saving…">
            {initial.id ? "Save changes" : "Create product"}
          </SubmitButton>
          {state.message && <p className={`mt-3 text-sm ${state.ok ? "text-emerald-300" : "text-rose-300"}`}>{state.message}</p>}
        </div>
      </div>
    </form>
  );
}
