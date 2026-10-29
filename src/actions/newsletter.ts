"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/types";

const schema = z.object({
  email: z.email("Please enter a valid email address").max(160),
  source: z.string().max(40).optional(),
});

export async function subscribeToNewsletter(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!rateLimit(`newsletter:${await clientIp()}`, 5, 60_000)) {
    return { ok: false, message: "Too many attempts — please try again in a minute." };
  }
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    source: String(formData.get("source") ?? "website"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  await db.subscriber.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email, source: parsed.data.source },
  });
  return { ok: true, message: "Welcome to the inner circle. Use code WELCOME10 for 10% off your first order." };
}
