import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/storefront/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your Zen Amour order and Pargo delivery.",
};

export default function TrackOrderPage() {
  return (
    <div className="container-luxe max-w-4xl py-16">
      <p className="eyebrow">Customer care</p>
      <h1 className="mt-3 font-serif text-5xl font-light text-white">Track your order</h1>
      <p className="mb-10 mt-4 max-w-xl text-zinc-400">
        Enter the order number from your confirmation email and the email address you checked out with.
      </p>
      <TrackOrderForm />
    </div>
  );
}
