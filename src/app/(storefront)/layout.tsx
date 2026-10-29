import { CartDrawer } from "@/components/storefront/CartDrawer";
import { CartProvider } from "@/components/storefront/CartProvider";
import { Footer } from "@/components/storefront/Footer";
import { Navbar } from "@/components/storefront/Navbar";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { Pixels } from "@/components/tracking/Pixels";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { getSettings, toPublicSettings } from "@/lib/settings";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const settings = toPublicSettings(await getSettings());

  return (
    <CartProvider>
      <Pixels
        metaPixelId={settings.metaPixelId}
        tiktokPixelId={settings.tiktokPixelId}
        ga4MeasurementId={settings.ga4MeasurementId}
        googleTagManagerId={settings.googleTagManagerId}
      />
      <div className="flex min-h-screen flex-col selection:bg-gold-500 selection:text-ink-900">
        <Navbar announcement={settings.announcement} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </div>
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
      <WhatsAppButton number={settings.whatsappNumber} />
      <NetworkStatus />
    </CartProvider>
  );
}
