import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api";
import { TimeoutError } from "@/lib/http";
import { captureError } from "@/lib/monitoring";
import { searchPickupPoints } from "@/lib/pargo";

export const GET = withApi({ name: "pargo.pickup-points", rateLimit: ["pickupPoints"], timeoutMs: 15_000 }, async (req) => {
  const search = new URL(req.url).searchParams.get("search")?.trim().slice(0, 80) ?? "";
  if (search.length < 3) throw new ApiError(400, "BAD_REQUEST", "Enter at least 3 characters.");

  try {
    const { points, source } = await searchPickupPoints(search);
    return NextResponse.json({ pickupPoints: points, source });
  } catch (err) {
    captureError(err, { area: "pargo", extra: { operation: "pickup-point-search" } });
    if (err instanceof TimeoutError) {
      throw new ApiError(504, "TIMEOUT", "Pargo is slow to respond. Try again, or choose door delivery.");
    }
    throw new ApiError(502, "UPSTREAM_UNAVAILABLE", "Pargo is unavailable right now. Try again, or choose door delivery.");
  }
});
