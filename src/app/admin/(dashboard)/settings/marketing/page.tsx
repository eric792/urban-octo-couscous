import Link from "next/link";
import { ArrowLeft, Save, Share2, Video } from "lucide-react";
import { saveMarketingSettings } from "@/actions/admin-settings";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Pixels & Social" };

export default async function AdminMarketingSettingsPage() {
  const s = await getSettings();

  return (
    <>
      <Link href="/admin/settings" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>
      <AdminHeader eyebrow="Integrations" title="Social Media & Tracking Pixels" />

      <ActionForm action={saveMarketingSettings} className="max-w-4xl space-y-6">
        <section className="admin-card space-y-6 p-6">
          <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
            <Share2 className="h-6 w-6 text-gold-400" />
            <div>
              <h2 className="text-lg font-medium text-white">Social media ad pixels &amp; analytics</h2>
              <p className="text-xs text-zinc-400">
                Fires PageView, ViewContent, AddToCart, InitiateCheckout and Purchase events (in ZAR) across the store. Leave blank to switch a pixel off.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="admin-label flex items-center gap-1.5" htmlFor="metaPixelId">
                <InstagramIcon className="h-3.5 w-3.5 text-pink-400" /> Meta Pixel ID (Facebook &amp; Instagram)
              </label>
              <input id="metaPixelId" name="metaPixelId" defaultValue={s.metaPixelId ?? ""} placeholder="e.g. 1029384756102" className="admin-input font-mono" />
            </div>
            <div>
              <label className="admin-label flex items-center gap-1.5" htmlFor="tiktokPixelId">
                <Video className="h-3.5 w-3.5 text-cyan-400" /> TikTok Pixel ID
              </label>
              <input id="tiktokPixelId" name="tiktokPixelId" defaultValue={s.tiktokPixelId ?? ""} placeholder="e.g. C1029384756TT" className="admin-input font-mono" />
            </div>
            <div>
              <label className="admin-label" htmlFor="ga4MeasurementId">GA4 Measurement ID</label>
              <input id="ga4MeasurementId" name="ga4MeasurementId" defaultValue={s.ga4MeasurementId ?? ""} placeholder="G-XXXXXXXXXX" className="admin-input font-mono" />
            </div>
            <div>
              <label className="admin-label" htmlFor="googleTagManagerId">Google Tag Manager ID</label>
              <input id="googleTagManagerId" name="googleTagManagerId" defaultValue={s.googleTagManagerId ?? ""} placeholder="GTM-XXXXXXX" className="admin-input font-mono" />
            </div>
          </div>
        </section>

        <section className="admin-card space-y-6 p-6">
          <h2 className="border-b border-zinc-800/80 pb-3 text-lg font-medium text-white">Social handles &amp; floating support</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="admin-label flex items-center gap-1.5" htmlFor="instagramUrl"><InstagramIcon className="h-3.5 w-3.5" /> Instagram page URL</label>
              <input id="instagramUrl" name="instagramUrl" defaultValue={s.instagramUrl ?? ""} placeholder="https://instagram.com/yourhandle" className="admin-input" />
            </div>
            <div>
              <label className="admin-label flex items-center gap-1.5" htmlFor="facebookUrl"><FacebookIcon className="h-3.5 w-3.5" /> Facebook page URL</label>
              <input id="facebookUrl" name="facebookUrl" defaultValue={s.facebookUrl ?? ""} placeholder="https://facebook.com/yourpage" className="admin-input" />
            </div>
            <div>
              <label className="admin-label flex items-center gap-1.5" htmlFor="tiktokUrl"><TikTokIcon className="h-3.5 w-3.5" /> TikTok profile URL</label>
              <input id="tiktokUrl" name="tiktokUrl" defaultValue={s.tiktokUrl ?? ""} placeholder="https://tiktok.com/@yourhandle" className="admin-input" />
            </div>
            <div>
              <label className="admin-label flex items-center gap-1.5" htmlFor="whatsappNumber"><WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp number (floating chat button)</label>
              <input id="whatsappNumber" name="whatsappNumber" defaultValue={s.whatsappNumber ?? ""} placeholder="+27821234567" className="admin-input" />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <SubmitButton variant="admin" pendingText="Saving…"><Save className="h-4 w-4" /> Save configuration</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
