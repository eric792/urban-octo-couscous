"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import type { ActionState } from "@/types";

const schema = z.object({
  email: z.email().max(160),
  password: z.string().min(1).max(200),
  next: z.string().max(200).optional(),
});

// Equalises timing when the email doesn't exist.
const DUMMY_HASH = "$2b$12$auWVc1w95s/JP8CvgK7xFe20T6mI6wVljnulcLiqQZ.J4jw1CXitC";

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes." };
  }

  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Enter your email and password." };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid || user.role !== "ADMIN") {
    return { ok: false, message: "Incorrect email or password." };
  }

  const token = await signSession({ sub: user.id, email: user.email, name: user.fullName, role: "ADMIN" });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const next = parsed.data.next;
  redirect(next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/admin/login");
}
