"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Map as MapIcon, MapPin, Store, X } from "lucide-react";
import { fetchJson } from "@/lib/client-fetch";
import { cn } from "@/lib/utils";
import type { PickupPoint } from "@/types";

interface Props {
  onSelectPoint: (point: PickupPoint) => void;
  selectedPoint?: PickupPoint | null;
  mapToken?: string | null;
  error?: string;
}

/** Turns the Pargo map's postMessage payload into a PickupPoint. */
function fromMapMessage(data: unknown): PickupPoint | null {
  const raw = typeof data === "string" ? safeJson(data) : data;
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
  const id = s(r.pargoPointCode) || s(r.code);
  const name = s(r.storeName) || s(r.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    address: [s(r.address1), s(r.address2)].filter(Boolean).join(", "),
    suburb: s(r.suburb),
    city: s(r.city),
    province: s(r.province) || undefined,
    postalCode: s(r.postalcode) || s(r.postalCode),
    businessHours: s(r.businessHours),
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function PargoPickupSelector({ onSelectPoint, selectedPoint, mapToken, error }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [source, setSource] = useState<"pargo" | "demo" | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  // Official Pargo map widget sends the chosen point back via postMessage.
  useEffect(() => {
    if (!mapOpen) return;
    const onMessage = (event: MessageEvent) => {
      let host = "";
      try {
        host = new URL(event.origin).hostname;
      } catch {
        return;
      }
      if (!/(^|\.)pargo\.co\.za$/.test(host)) return;
      const point = fromMapMessage(event.data);
      if (point) {
        onSelectPoint(point);
        setMapOpen(false);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mapOpen, onSelectPoint]);

  const searchPoints = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setMessage("Enter at least 3 characters — a suburb, city or postal code.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const result = await fetchJson<{ pickupPoints?: PickupPoint[]; source?: "pargo" | "demo" }>(
      `/api/pargo/pickup-points?search=${encodeURIComponent(query.trim())}`,
      { timeoutMs: 15_000, retries: 1 },
    );
    setLoading(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setPoints(result.data.pickupPoints ?? []);
    setSource(result.data.source ?? null);
    if (!result.data.pickupPoints?.length) setMessage("No pickup points found there — try a nearby suburb or city.");
  };

  return (
    <div className={cn("space-y-4 border bg-ink-800/60 p-5", error ? "border-rose-500/50" : "border-ink-500")}>
      <div className="flex items-start gap-3">
        <div className="border border-gold-500/20 bg-gold-500/10 p-2.5 text-gold-400">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-medium text-white">Select a Pargo Pickup Point</h3>
          <p className="text-xs text-zinc-400">Collect your order from a Pargo counter near you — Clicks, FreshStop and more.</p>
        </div>
      </div>

      {selectedPoint && (
        <div className="flex items-start justify-between gap-3 border border-gold-500 bg-gold-500/10 p-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-400">Selected pickup point</p>
            <p className="mt-1 font-semibold text-white">{selectedPoint.name}</p>
            <p className="text-xs text-zinc-400">
              {[selectedPoint.address, selectedPoint.suburb, selectedPoint.city].filter(Boolean).join(", ")}
            </p>
            {selectedPoint.businessHours && <p className="mt-1 text-[11px] text-zinc-500">Hours: {selectedPoint.businessHours}</p>}
          </div>
          <span className="rounded-full bg-gold-500 p-1 text-ink-900"><Check className="h-4 w-4" /></span>
        </div>
      )}

      <div className="relative">
        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Suburb, city or postal code (e.g. Sandton, 2196)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              searchPoints(searchQuery);
            }
          }}
          className="input pl-10 pr-24"
          aria-label="Search Pargo pickup points"
        />
        <button
          type="button"
          onClick={() => searchPoints(searchQuery)}
          className="absolute bottom-1.5 right-1.5 top-1.5 flex items-center gap-1.5 bg-gold-500 px-4 text-xs font-semibold text-ink-900 transition hover:bg-gold-400"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Searching" : "Find"}
        </button>
      </div>

      {mapToken && (
        <button type="button" onClick={() => setMapOpen(true)} className="btn-ghost px-0">
          <MapIcon className="h-4 w-4" /> Or choose on the Pargo map
        </button>
      )}

      {message && <p className="text-xs text-zinc-400">{message}</p>}
      {error && <p className="field-error">{error}</p>}

      {points.length > 0 && (
        <div className="scrollbar-thin max-h-72 space-y-2.5 overflow-y-auto pr-1">
          {source === "demo" && (
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold-600">Sandbox demo points — connect Pargo in Admin → Settings</p>
          )}
          {points.map((point) => {
            const isSelected = selectedPoint?.id === point.id;
            return (
              <button
                type="button"
                key={point.id}
                onClick={() => onSelectPoint(point)}
                className={cn(
                  "flex w-full items-start justify-between border p-3.5 text-left text-sm transition",
                  isSelected ? "border-gold-500 bg-gold-500/10 text-white" : "border-ink-500 bg-ink-900/50 text-zinc-300 hover:border-zinc-500",
                )}
                aria-pressed={isSelected}
              >
                <span className="space-y-1">
                  <span className="block font-semibold text-gold-300">{point.name}</span>
                  <span className="block text-xs text-zinc-400">{[point.address, point.suburb, point.city].filter(Boolean).join(", ")}</span>
                  {point.businessHours && <span className="block text-[11px] text-zinc-500">Hours: {point.businessHours}</span>}
                </span>
                {isSelected && (
                  <span className="rounded-full bg-gold-500 p-1 text-ink-900"><Check className="h-4 w-4" /></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {mapOpen && mapToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Pargo map">
          <div className="relative h-[85vh] w-full max-w-4xl overflow-hidden border border-ink-500 bg-ink-900">
            <button
              type="button"
              onClick={() => setMapOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-ink-900/90 p-2 text-zinc-300 hover:text-white"
              aria-label="Close map"
            >
              <X className="h-5 w-5" />
            </button>
            <iframe
              title="Pargo pickup point map"
              src={`https://map.pargo.co.za/?token=${encodeURIComponent(mapToken)}`}
              className="h-full w-full"
              allow="geolocation"
            />
          </div>
        </div>
      )}
    </div>
  );
}
