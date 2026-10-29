import type { Metadata } from "next";
import { CartView } from "@/components/storefront/CartView";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Your Bag", robots: { index: false } };

export default async function CartPage() {
  const settings = await getSettings();
  return (
    <div className="container-luxe py-14">
      <p className="eyebrow">Shopping bag</p>
      <h1 className="mb-10 mt-3 font-serif text-5xl font-light text-white">Your Bag</h1>
      <CartView freeShippingThreshold={settings.freeShippingThreshold} />
    </div>
  );
}
