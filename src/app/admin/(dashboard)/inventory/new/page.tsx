import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { db } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <Link href="/admin/inventory" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Inventory
      </Link>
      <AdminHeader eyebrow="Inventory" title="New product" />
      <ProductForm
        categories={categories}
        initial={{
          id: null,
          name: "",
          slug: "",
          categoryId: categories[0]?.id ?? "",
          tagline: "",
          description: "",
          scentNotes: "",
          concentration: "",
          scentFamily: "",
          inspiredBy: "",
          seoTitle: "",
          seoDescription: "",
          images: [],
          isFeatured: false,
          isActive: true,
          variants: [{ sku: "", volume: "", price: "", comparePrice: "", stock: "0" }],
        }}
      />
    </>
  );
}
