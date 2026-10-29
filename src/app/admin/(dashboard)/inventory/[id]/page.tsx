import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/admin-products";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { db } from "@/lib/db";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/inventory" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Inventory
      </Link>
      <AdminHeader eyebrow="Inventory" title={product.name}>
        {product.isActive && (
          <Link href={`/product/${product.slug}`} target="_blank" className="admin-btn-secondary">View in store ↗</Link>
        )}
      </AdminHeader>
      <ProductForm
        key={product.variants.map((v) => v.id).join(",")}
        categories={categories}
        saved={saved === "1"}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          categoryId: product.categoryId,
          tagline: product.tagline ?? "",
          description: product.description,
          scentNotes: product.scentNotes ?? "",
          images: product.images,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          variants: product.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            volume: v.volume ?? "",
            price: v.price.toString(),
            comparePrice: v.comparePrice?.toString() ?? "",
            stock: String(v.stock),
          })),
        }}
      />
      <div className="mt-10 border-t border-zinc-800 pt-6">
        <ActionForm action={deleteProduct.bind(null, product.id)} confirmText={`Permanently delete ${product.name}?`}>
          <SubmitButton variant="danger"><Trash2 className="h-4 w-4" /> Delete product</SubmitButton>
        </ActionForm>
      </div>
    </>
  );
}
