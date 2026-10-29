"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SETTINGS_ID } from "@/lib/settings";
import { PIXEL_ID_PATTERNS } from "@/lib/tracking/pixels";
import type { ActionState } from "@/types";

const text = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v), z.string().max(max).nullable());
const url = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v),
  z.string().max(300).regex(/^https:\/\//, "Social links must start with https://").nullable(),
);
const pixel = (pattern: RegExp, label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.trim() : v),
    z.string().regex(pattern, `${label} doesn't look right — check it in your ads manager`).nullable(),
  );
const money = z.coerce.number().min(0).max(100_000);
const phone = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? null : typeof v === "string" ? v.replace(/[\s()-]/g, "") : v),
  z.string().regex(/^(\+27|0)\d{9}$/, "Enter a South African number like +27821234567").nullable(),
);

async function save(data: Record<string, unknown>): Promise<ActionState> {
  await db.storeSettings.upsert({ where: { id: SETTINGS_ID }, update: data, create: { id: SETTINGS_ID, ...data } });
  revalidateTag("settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved" };
}

function form(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function saveGeneralSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ announcement: text(160), contactEmail: z.preprocess((v) => (v === "" ? null : v), z.email("Enter a valid email").nullable()) })
    .safeParse(form(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  return save(parsed.data);
}

export async function saveShippingSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({ pargoPickupFee: money, pargoDoorFee: money, courierFee: money, freeShippingThreshold: money })
    .safeParse(form(formData));
  if (!parsed.success) return { ok: false, message: "Fees must be numbers of R0 or more." };
  return save(parsed.data);
}

export async function savePaymentSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      eftBankName: text(80),
      eftAccountName: text(120),
      eftAccountNumber: z.preprocess((v) => (v === "" ? null : String(v).replace(/\s/g, "")), z.string().regex(/^\d{6,16}$/, "Account number should be 6–16 digits").nullable()),
      eftBranchCode: z.preprocess((v) => (v === "" ? null : String(v).replace(/\s/g, "")), z.string().regex(/^\d{4,8}$/, "Branch code should be digits").nullable()),
    })
    .safeParse(form(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  return save({
    ...parsed.data,
    yocoEnabled: formData.get("yocoEnabled") === "on",
    payfastEnabled: formData.get("payfastEnabled") === "on",
    eftEnabled: formData.get("eftEnabled") === "on",
  });
}

export async function savePargoSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      pargoEnvironment: z.enum(["sandbox", "live"]),
      pargoUsername: text(120),
      pargoMapToken: text(200),
      pargoApiKey: z.string().max(300).optional(),
    })
    .safeParse(form(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { pargoApiKey, ...rest } = parsed.data;
  return save({
    ...rest,
    // The secret is write-only: blank keeps the saved value.
    ...(formData.get("clearPargoApiKey") === "on" ? { pargoApiKey: null } : pargoApiKey?.trim() ? { pargoApiKey: pargoApiKey.trim() } : {}),
  });
}

export async function saveMarketingSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      metaPixelId: pixel(PIXEL_ID_PATTERNS.metaPixelId, "Meta Pixel ID"),
      tiktokPixelId: pixel(PIXEL_ID_PATTERNS.tiktokPixelId, "TikTok Pixel ID"),
      ga4MeasurementId: pixel(PIXEL_ID_PATTERNS.ga4MeasurementId, "GA4 Measurement ID"),
      googleTagManagerId: pixel(PIXEL_ID_PATTERNS.googleTagManagerId, "GTM container ID"),
      instagramUrl: url,
      facebookUrl: url,
      tiktokUrl: url,
      whatsappNumber: phone,
    })
    .safeParse(form(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  return save(parsed.data);
}
