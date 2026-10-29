import Link from "next/link";
import { Activity, ArrowRight, CreditCard, Landmark, Store, Truck, Webhook } from "lucide-react";
import { saveGeneralSettings, savePargoSettings, savePaymentSettings, saveShippingSettings } from "@/actions/admin-settings";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/Badge";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getPargoConfig } from "@/lib/pargo";
import { gatewayStatus, getSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";

export const metadata = { title: "Settings" };

function Section({ Icon, title, text, children }: { Icon: typeof Store; title: string; text: string; children: React.ReactNode }) {
  return (
    <section className="admin-card p-6">
      <div className="mb-6 flex items-center gap-3 border-b border-zinc-800/80 pb-4">
        <Icon className="h-6 w-6 text-gold-400" />
        <div>
          <h2 className="text-lg font-medium text-white">{title}</h2>
          <p className="text-xs text-zinc-400">{text}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Toggle({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked: boolean; hint?: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-gold-500" />
      <span>
        <span className="block text-zinc-200">{label}</span>
        {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
      </span>
    </label>
  );
}

export default async function AdminSettingsPage() {
  const [s, pargo] = await Promise.all([getSettings(), getPargoConfig()]);
  const gw = gatewayStatus();
  const envPargo = Boolean(process.env.PARGO_USERNAME || process.env.PARGO_PASSWORD);

  return (
    <>
      <AdminHeader eyebrow="Gateway & Shipping Config" title="Settings">
        <Link href="/admin/settings/marketing" className="admin-btn-secondary">
          Pixels &amp; social <ArrowRight className="h-4 w-4" />
        </Link>
      </AdminHeader>

      <div className="max-w-4xl space-y-6">
        <Section Icon={Store} title="Store details" text="Shown in the announcement bar, contact page and emails.">
          <ActionForm action={saveGeneralSettings} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="admin-label" htmlFor="announcement">Announcement bar</label>
              <input id="announcement" name="announcement" maxLength={160} defaultValue={s.announcement ?? ""} placeholder="Free delivery on orders over R750" className="admin-input" />
            </div>
            <div>
              <label className="admin-label" htmlFor="contactEmail">Customer service email</label>
              <input id="contactEmail" name="contactEmail" type="email" defaultValue={s.contactEmail ?? ""} className="admin-input" />
            </div>
            <div className="flex items-end justify-end">
              <SubmitButton variant="admin" pendingText="Saving…">Save</SubmitButton>
            </div>
          </ActionForm>
        </Section>

        <Section Icon={Truck} title="Delivery fees" text="Charged at checkout in ZAR. Set the free-delivery threshold to 0 to switch it off.">
          <ActionForm action={saveShippingSettings} className="grid gap-4 sm:grid-cols-4">
            {[
              ["pargoPickupFee", "Pargo pickup point", s.pargoPickupFee],
              ["pargoDoorFee", "Pargo door-to-door", s.pargoDoorFee],
              ["courierFee", "Standard courier", s.courierFee],
              ["freeShippingThreshold", "Free delivery over", s.freeShippingThreshold],
            ].map(([name, label, value]) => (
              <div key={name as string}>
                <label className="admin-label" htmlFor={name as string}>{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-zinc-500">R</span>
                  <input id={name as string} name={name as string} type="number" min="0" step="0.01" defaultValue={value as number} className="admin-input pl-7" />
                </div>
              </div>
            ))}
            <div className="flex justify-end sm:col-span-4">
              <SubmitButton variant="admin" pendingText="Saving…">Save fees</SubmitButton>
            </div>
          </ActionForm>
        </Section>

        <Section Icon={CreditCard} title="Payment gateways" text="API keys live in environment variables so they never sit in the database.">
          <ActionForm action={savePaymentSettings} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Toggle
                name="yocoEnabled"
                label="Yoco card payments"
                defaultChecked={s.yocoEnabled}
                hint={gw.yoco.configured ? <>Key set · <b className="uppercase">{gw.yoco.mode}</b>{!gw.yoco.webhookConfigured && " · webhook secret missing"}</> : "Set YOCO_SECRET_KEY to enable"}
              />
              <Toggle
                name="payfastEnabled"
                label="Payfast"
                defaultChecked={s.payfastEnabled}
                hint={gw.payfast.configured ? <>Merchant set · <b className="uppercase">{gw.payfast.mode}</b>{!gw.payfast.passphraseSet && " · no passphrase"}</> : "Set PAYFAST_MERCHANT_ID / KEY"}
              />
              <Toggle name="eftEnabled" label="Manual EFT" defaultChecked={s.eftEnabled} hint="Shown once bank details are saved" />
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><Landmark className="h-4 w-4 text-gold-400" /> EFT bank details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="admin-label" htmlFor="eftBankName">Bank</label>
                  <input id="eftBankName" name="eftBankName" defaultValue={s.eftBankName ?? ""} placeholder="FNB" className="admin-input" />
                </div>
                <div>
                  <label className="admin-label" htmlFor="eftAccountName">Account holder</label>
                  <input id="eftAccountName" name="eftAccountName" defaultValue={s.eftAccountName ?? ""} placeholder="Zen Amour (Pty) Ltd" className="admin-input" />
                </div>
                <div>
                  <label className="admin-label" htmlFor="eftAccountNumber">Account number</label>
                  <input id="eftAccountNumber" name="eftAccountNumber" inputMode="numeric" defaultValue={s.eftAccountNumber ?? ""} className="admin-input" />
                </div>
                <div>
                  <label className="admin-label" htmlFor="eftBranchCode">Branch code</label>
                  <input id="eftBranchCode" name="eftBranchCode" inputMode="numeric" defaultValue={s.eftBranchCode ?? ""} placeholder="250655" className="admin-input" />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <SubmitButton variant="admin" pendingText="Saving…">Save payments</SubmitButton>
            </div>
          </ActionForm>

          <div className="mt-6 rounded border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400">
            <p className="mb-2 flex items-center gap-2 font-medium text-zinc-200"><Webhook className="h-4 w-4 text-gold-400" /> Webhook URLs</p>
            <p>Yoco: <code className="text-gold-300">{absoluteUrl("/api/webhooks/yoco")}</code> — register it with <code>npm run yoco:webhook</code></p>
            <p className="mt-1">Payfast ITN: <code className="text-gold-300">{absoluteUrl("/api/webhooks/payfast")}</code> — sent automatically with each payment</p>
          </div>
        </Section>

        <Section Icon={Activity} title="Error monitoring (Sentry)" text="Payment, webhook, Pargo and email failures are reported to Sentry with customer details stripped.">
          <div className="flex flex-wrap gap-2">
            {gw.sentry.configured ? <Badge tone="green">Connected</Badge> : <Badge tone="zinc">Not connected</Badge>}
            <Badge tone="blue">{gw.sentry.environment}</Badge>
            {gw.sentry.sourceMaps ? <Badge tone="green">Source maps upload</Badge> : <Badge tone="zinc">No source maps</Badge>}
          </div>
          {!gw.sentry.configured && (
            <p className="mt-4 text-xs text-zinc-500">
              Set <code className="text-gold-300">NEXT_PUBLIC_SENTRY_DSN</code> (and optionally <code className="text-gold-300">SENTRY_ORG</code>, <code className="text-gold-300">SENTRY_PROJECT</code>, <code className="text-gold-300">SENTRY_AUTH_TOKEN</code> for readable stack traces), then redeploy.
            </p>
          )}
        </Section>

        <Section Icon={Truck} title="Pargo courier & pickup gateway" text="Pickup point search, automatic waybill generation and status sync.">
          <div className="mb-5 flex flex-wrap gap-2">
            {pargo.configured ? <Badge tone="green">API connected</Badge> : <Badge tone="zinc">API not connected</Badge>}
            <Badge tone={pargo.environment === "live" ? "gold" : "blue"}>{pargo.environment}</Badge>
            {pargo.mapToken ? <Badge tone="green">Map token set</Badge> : <Badge tone="zinc">No map token</Badge>}
            {envPargo && <Badge tone="purple">Using env credentials</Badge>}
          </div>
          {!pargo.configured && pargo.environment === "sandbox" && (
            <p className="mb-5 text-xs text-zinc-500">Until Pargo is connected, checkout shows sandbox demo pickup points so you can test the flow.</p>
          )}
          <ActionForm action={savePargoSettings} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="admin-label" htmlFor="pargoEnvironment">Environment</label>
              <select id="pargoEnvironment" name="pargoEnvironment" defaultValue={s.pargoEnvironment} className="admin-input">
                <option value="sandbox">Sandbox / Testing</option>
                <option value="live">Live Production</option>
              </select>
            </div>
            <div>
              <label className="admin-label" htmlFor="pargoUsername">API username</label>
              <input id="pargoUsername" name="pargoUsername" defaultValue={s.pargoUsername ?? ""} autoComplete="off" className="admin-input" />
            </div>
            <div>
              <label className="admin-label" htmlFor="pargoApiKey">API password / secret key</label>
              <input id="pargoApiKey" name="pargoApiKey" type="password" autoComplete="new-password" placeholder={s.pargoApiKeySet ? "•••••••• saved — leave blank to keep" : "Paste your Pargo secret"} className="admin-input" />
              {s.pargoApiKeySet && (
                <label className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                  <input type="checkbox" name="clearPargoApiKey" className="accent-gold-500" /> Remove saved secret
                </label>
              )}
            </div>
            <div>
              <label className="admin-label" htmlFor="pargoMapToken">Map token (public)</label>
              <input id="pargoMapToken" name="pargoMapToken" defaultValue={s.pargoMapToken ?? ""} className="admin-input" />
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400 sm:col-span-2">
              Status webhook for Pargo: <code className="break-all text-gold-300">{absoluteUrl("/api/webhooks/pargo")}?secret=PARGO_WEBHOOK_SECRET</code>
            </div>
            <div className="flex justify-end sm:col-span-2">
              <SubmitButton variant="admin" pendingText="Saving…">Save Pargo</SubmitButton>
            </div>
          </ActionForm>
        </Section>
      </div>
    </>
  );
}
