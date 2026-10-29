"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  ExternalLink,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", Icon: BarChart3, exact: true },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", Icon: Package },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/marketing", label: "Marketing", Icon: Megaphone },
  { href: "/admin/journal", label: "Journal", Icon: BookOpen },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

/** Pulses next to a sidebar link while its page is loading. */
function PendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn("h-1.5 w-1.5 rounded-full bg-gold-400 transition-opacity", pending ? "animate-pulse opacity-100" : "opacity-0")}
    />
  );
}

export function AdminSidebar({ adminName, pendingCount }: { adminName: string; pendingCount: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded px-3 py-2.5 text-sm transition",
              active ? "bg-gold-500/10 text-gold-300" : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            <PendingDot />
            {href === "/admin/orders" && pendingCount > 0 && (
              <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold text-ink-900">{pendingCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-zinc-800 p-3">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded px-3 py-2 text-sm text-zinc-500 hover:text-white">
        <ExternalLink className="h-4 w-4" /> View store
      </Link>
      <form action={logout}>
        <button type="submit" className="flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-zinc-500 hover:text-white">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </form>
      <p className="truncate px-3 pt-2 text-xs text-zinc-600">{adminName}</p>
    </div>
  );

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 lg:hidden">
        <Link href="/admin" className="font-serif text-lg tracking-[0.25em] text-gold-400">ZEN AMOUR</Link>
        <button onClick={() => setOpen(true)} className="p-2 text-zinc-300" aria-label="Open admin menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-zinc-950">
            <div className="flex h-16 items-center justify-between px-6">
              <span className="font-serif text-lg tracking-[0.25em] text-gold-400">ZEN AMOUR</span>
              <button onClick={() => setOpen(false)} className="text-zinc-400" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            {links}
            {footer}
          </aside>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 lg:flex">
        <div className="px-6 py-6">
          <Link href="/admin" className="font-serif text-xl tracking-[0.3em] text-gold-400">ZEN AMOUR</Link>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">Admin</p>
        </div>
        {links}
        {footer}
      </aside>
    </>
  );
}
