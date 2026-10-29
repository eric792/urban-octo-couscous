import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Zen Amour Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const pendingCount = await db.order.count({ where: { status: "NEW" } });

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 lg:flex">
      <AdminSidebar adminName={admin.email} pendingCount={pendingCount} />
      <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
