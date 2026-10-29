import type { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { db } from "@/lib/db";
import { markPaymentFailed } from "@/lib/orders";

export const metadata: Metadata = { title: "Payment not completed", robots: { index: false } };

type SearchParams = Promise<{ ref?: string; failed?: string }>;

export default async function CheckoutCancelledPage({ searchParams }: { searchParams: SearchParams }) {
  const { ref, failed } = await searchParams;
  const order = ref ? await db.order.findUnique({ where: { id: ref }, select: { id: true, orderNumber: true, gateway: true } }) : null;

  // Release the unpaid order. If a late payment still arrives, the webhook re-opens it.
  if (order) {
    await markPaymentFailed(order.id, order.gateway, failed ? "Payment failed at the gateway." : "Shopper cancelled at the gateway.");
  }

  return (
    <div className="container-luxe flex max-w-2xl flex-col items-center py-24 text-center">
      <XCircle className="h-14 w-14 text-zinc-500" strokeWidth={1.2} />
      <h1 className="mt-6 font-serif text-5xl font-light text-white">
        {failed ? "Payment didn't go through" : "Payment cancelled"}
      </h1>
      <p className="mt-4 text-zinc-400">
        {failed
          ? "Your bank or card provider declined the payment. No money was taken — your bag is still saved."
          : "No worries — nothing was charged and your bag is still saved."}
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link href="/checkout" className="btn-gold">Try again</Link>
        <Link href="/contact" className="btn-outline">Need help?</Link>
      </div>
    </div>
  );
}
