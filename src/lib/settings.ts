import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import type { PublicSettings } from "@/types";

export const SETTINGS_ID = "default_settings";

export interface StoreConfig extends PublicSettings {
  pargoUsername: string | null;
  pargoApiKeySet: boolean;
  pargoEnvironment: string;
  eftBankName: string | null;
  eftAccountName: string | null;
  eftAccountNumber: string | null;
  eftBranchCode: string | null;
  updatedAt: string | null;
}

const DEFAULTS: StoreConfig = {
  metaPixelId: null,
  tiktokPixelId: null,
  ga4MeasurementId: null,
  googleTagManagerId: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  whatsappNumber: null,
  contactEmail: null,
  announcement: null,
  pargoMapToken: null,
  pargoPickupFee: 65,
  pargoDoorFee: 99,
  courierFee: 110,
  freeShippingThreshold: 750,
  yocoEnabled: true,
  payfastEnabled: true,
  eftEnabled: true,
  pargoUsername: null,
  pargoApiKeySet: false,
  pargoEnvironment: "sandbox",
  eftBankName: null,
  eftAccountName: null,
  eftAccountNumber: null,
  eftBranchCode: null,
  updatedAt: null,
};

async function loadSettings(): Promise<StoreConfig> {
  const s = await db.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!s) return DEFAULTS;
  return {
    metaPixelId: s.metaPixelId,
    tiktokPixelId: s.tiktokPixelId,
    ga4MeasurementId: s.ga4MeasurementId,
    googleTagManagerId: s.googleTagManagerId,
    instagramUrl: s.instagramUrl,
    facebookUrl: s.facebookUrl,
    tiktokUrl: s.tiktokUrl,
    whatsappNumber: s.whatsappNumber,
    contactEmail: s.contactEmail,
    announcement: s.announcement,
    pargoMapToken: process.env.PARGO_MAP_TOKEN || s.pargoMapToken,
    pargoPickupFee: toNumber(s.pargoPickupFee),
    pargoDoorFee: toNumber(s.pargoDoorFee),
    courierFee: toNumber(s.courierFee),
    freeShippingThreshold: toNumber(s.freeShippingThreshold),
    yocoEnabled: s.yocoEnabled,
    payfastEnabled: s.payfastEnabled,
    eftEnabled: s.eftEnabled,
    pargoUsername: s.pargoUsername,
    pargoApiKeySet: Boolean(s.pargoApiKey),
    pargoEnvironment: s.pargoEnvironment,
    eftBankName: s.eftBankName,
    eftAccountName: s.eftAccountName,
    eftAccountNumber: s.eftAccountNumber,
    eftBranchCode: s.eftBranchCode,
    updatedAt: s.updatedAt.toISOString(),
  };
}

/** Cached store settings (secrets excluded). Invalidated with revalidateTag("settings"). */
export const getSettings = unstable_cache(loadSettings, ["store-settings"], {
  tags: ["settings"],
  revalidate: 300,
});

export function toPublicSettings(s: StoreConfig): PublicSettings {
  return {
    metaPixelId: s.metaPixelId,
    tiktokPixelId: s.tiktokPixelId,
    ga4MeasurementId: s.ga4MeasurementId,
    googleTagManagerId: s.googleTagManagerId,
    instagramUrl: s.instagramUrl,
    facebookUrl: s.facebookUrl,
    tiktokUrl: s.tiktokUrl,
    whatsappNumber: s.whatsappNumber,
    contactEmail: s.contactEmail,
    announcement: s.announcement,
    pargoMapToken: s.pargoMapToken,
    pargoPickupFee: s.pargoPickupFee,
    pargoDoorFee: s.pargoDoorFee,
    courierFee: s.courierFee,
    freeShippingThreshold: s.freeShippingThreshold,
    yocoEnabled: s.yocoEnabled,
    payfastEnabled: s.payfastEnabled,
    eftEnabled: s.eftEnabled,
  };
}

/** Which payment gateways have credentials configured in the environment. */
export function gatewayStatus() {
  return {
    yoco: {
      configured: Boolean(process.env.YOCO_SECRET_KEY),
      mode: process.env.YOCO_SECRET_KEY?.startsWith("sk_live") ? "live" : "test",
      webhookConfigured: Boolean(process.env.YOCO_WEBHOOK_SECRET),
    },
    sentry: {
      configured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN),
      sourceMaps: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT),
      environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    },
    payfast: {
      configured: Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY),
      mode: process.env.PAYFAST_SANDBOX === "false" ? "live" : "sandbox",
      passphraseSet: Boolean(process.env.PAYFAST_PASSPHRASE),
    },
  };
}
