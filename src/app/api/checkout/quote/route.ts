import { NextResponse } from "next/server";
import { withApi } from "@/lib/api";
import { buildQuote } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { quoteSchema } from "@/lib/validation";

export const POST = withApi({ name: "checkout.quote", rateLimit: ["quote"], maxBodyBytes: 8_192, timeoutMs: 10_000 }, async (_req, ctx) => {
  const input = quoteSchema.parse(ctx.json());
  const quote = await buildQuote(input, await getSettings());
  return NextResponse.json(quote);
});
