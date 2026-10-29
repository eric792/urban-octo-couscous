import { NextResponse } from "next/server";
import { searchPickupPoints } from "@/lib/pargo";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  if (!rateLimit(`pargo:${await clientIp()}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many searches — please wait a moment." }, { status: 429 });
  }
  const search = new URL(req.url).searchParams.get("search")?.trim().slice(0, 80) ?? "";
  if (search.length < 3) {
    return NextResponse.json({ error: "Enter at least 3 characters." }, { status: 400 });
  }
  try {
    const { points, source } = await searchPickupPoints(search);
    return NextResponse.json({ pickupPoints: points, source });
  } catch (err) {
    console.error("[pargo] pickup point search failed", err);
    return NextResponse.json({ error: "Pargo is unavailable right now. Try door delivery instead." }, { status: 502 });
  }
}
