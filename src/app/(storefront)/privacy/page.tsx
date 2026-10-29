import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/InfoPage";
import { LEGAL_NAME } from "@/lib/constants";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy Policy (POPIA)", description: "How Zen Amour collects and protects your personal information." };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <InfoPage eyebrow="Legal" title="Privacy Policy" intro={`${LEGAL_NAME} processes personal information in line with the Protection of Personal Information Act (POPIA).`}>
      <section>
        <h2>What we collect</h2>
        <ul className="space-y-2">
          <li>Your name, email, phone number and delivery address or chosen Pargo point — to fulfil your order.</li>
          <li>Order history — for customer service, returns and accounting.</li>
          <li>Marketing preferences — only if you opt in to our newsletter.</li>
        </ul>
      </section>
      <section>
        <h2>Payments</h2>
        <p>Card and EFT payments are processed by Yoco and Payfast. We never see or store your full card details.</p>
      </section>
      <section>
        <h2>Who we share it with</h2>
        <p>Only the partners needed to serve you: our payment providers, Pargo and courier partners for delivery, our email provider, and Sentry, which records technical errors so we can fix them (configured not to collect your name, contact details, address or IP address). We never sell your information.</p>
      </section>
      <section>
        <h2>Cookies &amp; advertising</h2>
        <p>We use essential storage to remember your bag. With analytics and advertising tools (Google Analytics, Meta and TikTok pixels) we measure which campaigns work and show relevant ads. You can block these cookies in your browser settings at any time.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>You may request access to, correction of, or deletion of your personal information, and unsubscribe from marketing at any time{ s.contactEmail ? <> by emailing <a className="text-gold-400" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></> : "" }. You may also lodge a complaint with the Information Regulator of South Africa.</p>
      </section>
    </InfoPage>
  );
}
