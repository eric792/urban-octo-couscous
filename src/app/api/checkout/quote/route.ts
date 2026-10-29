import { NextResponse } from "next/server";
import { buildQuote } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { quoteSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!rateLimit(`quote:${await clientIp()}`, 60, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid basket" }, { status: 400 });

  const quote = await buildQuote(parsed.data, await getSettings());
  return NextResponse.json(quote);
}
