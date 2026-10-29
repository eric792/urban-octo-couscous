import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-serif text-3xl tracking-[0.3em] text-gold-400">ZEN AMOUR</p>
          <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">Owner dashboard</p>
        </div>
        <div className="admin-card p-7">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
