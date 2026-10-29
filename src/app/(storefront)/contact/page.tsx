import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, Package } from "lucide-react";
import { InfoPage } from "@/components/storefront/InfoPage";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = { title: "Contact Us", description: "Get in touch with the Zen Amour team." };

export default async function ContactPage() {
  const s = await getSettings();
  const cards = [
    s.whatsappNumber && {
      Icon: WhatsAppIcon,
      title: "WhatsApp",
      text: "The fastest way to reach us.",
      href: whatsappLink(s.whatsappNumber, "Hi Zen Amour, "),
      cta: s.whatsappNumber,
    },
    s.contactEmail && { Icon: Mail, title: "Email", text: "We reply within one working day.", href: `mailto:${s.contactEmail}`, cta: s.contactEmail },
    s.instagramUrl && { Icon: InstagramIcon, title: "Instagram", text: "DMs are always open.", href: s.instagramUrl, cta: "Message us" },
  ].filter(Boolean) as { Icon: typeof Mail; title: string; text: string; href: string; cta: string }[];

  return (
    <InfoPage eyebrow="Customer care" title="Contact Us" intro="Questions about a scent, an order or a gift? We'd love to help.">
      {cards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(({ Icon, title, text, href, cta }) => (
            <a key={title} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="card block p-6 transition hover:border-gold-500/60">
              <Icon className="h-6 w-6 text-gold-400" />
              <p className="mt-4 font-serif text-xl text-white">{title}</p>
              <p className="text-sm">{text}</p>
              <p className="mt-3 text-sm text-gold-300">{cta}</p>
            </a>
          ))}
        </div>
      ) : (
        <p>Contact details are coming soon.</p>
      )}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="flex gap-4">
          <Clock className="h-5 w-5 shrink-0 text-gold-400" />
          <div>
            <p className="font-medium text-white">Support hours</p>
            <p>Mon–Fri 08:30–17:00 · Sat 09:00–13:00 (SAST)</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Package className="h-5 w-5 shrink-0 text-gold-400" />
          <div>
            <p className="font-medium text-white">Where&apos;s my order?</p>
            <p><Link href="/track-order" className="text-gold-400 hover:text-gold-300">Track it here</Link> with your order number.</p>
          </div>
        </div>
      </section>
    </InfoPage>
  );
}
