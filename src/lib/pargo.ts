import { db } from "@/lib/db";
import { fetchWithTimeout, TIMEOUTS } from "@/lib/http";
import { SETTINGS_ID } from "@/lib/settings";
import type { PickupPoint } from "@/types";

/*
 * Pargo integration (pickup points, waybills, status webhooks).
 *
 * Pargo issues each merchant API credentials, a map token and the exact API
 * base URL for staging and production. Credentials can live in env vars or in
 * Admin → Settings. Paths below follow Pargo's merchant API; if your account
 * uses a different version, set PARGO_API_BASE_URL.
 */

const DEFAULT_BASE = {
  sandbox: "https://api.staging.pargo.co.za",
  live: "https://api.pargo.co.za",
};

export interface PargoConfig {
  username: string | null;
  password: string | null;
  mapToken: string | null;
  environment: "sandbox" | "live";
  baseUrl: string;
  configured: boolean;
}

export async function getPargoConfig(): Promise<PargoConfig> {
  const s = await db.storeSettings.findUnique({ where: { id: SETTINGS_ID } });
  const environment = s?.pargoEnvironment === "live" ? "live" : "sandbox";
  const username = process.env.PARGO_USERNAME || s?.pargoUsername || null;
  const password = process.env.PARGO_PASSWORD || s?.pargoApiKey || null;
  return {
    username,
    password,
    mapToken: process.env.PARGO_MAP_TOKEN || s?.pargoMapToken || null,
    environment,
    baseUrl: (process.env.PARGO_API_BASE_URL || DEFAULT_BASE[environment]).replace(/\/$/, ""),
    configured: Boolean(username && password),
  };
}

let tokenCache: { token: string; expiresAt: number; key: string } | null = null;

async function getAccessToken(cfg: PargoConfig): Promise<string> {
  const key = `${cfg.baseUrl}|${cfg.username}`;
  if (tokenCache && tokenCache.key === key && tokenCache.expiresAt > Date.now()) return tokenCache.token;

  const res = await fetchWithTimeout("Pargo", `${cfg.baseUrl}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: cfg.username, password: cfg.password }),
    timeoutMs: TIMEOUTS.pargo,
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !data.access_token) throw new Error(`Pargo authentication failed (${res.status})`);
  tokenCache = {
    token: data.access_token,
    key,
    expiresAt: Date.now() + Math.max((data.expires_in ?? 3600) - 60, 60) * 1000,
  };
  return data.access_token;
}

async function pargoFetch(cfg: PargoConfig, path: string, init: RequestInit = {}) {
  const token = await getAccessToken(cfg);
  const res = await fetchWithTimeout("Pargo", `${cfg.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
    timeoutMs: TIMEOUTS.pargo,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Pargo API ${path} failed (${res.status})`);
  return data as Record<string, unknown>;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

/** Maps a Pargo point (API or map widget postMessage) to our shape. */
export function normalizePickupPoint(raw: unknown): PickupPoint | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const a = (r.attributes && typeof r.attributes === "object" ? r.attributes : r) as Record<string, unknown>;
  const id = str(a.pargoPointCode) || str(a.code) || str(r.id) || str(a.id);
  const name = str(a.storeName) || str(a.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    address: [str(a.address1), str(a.address2)].filter(Boolean).join(", ") || str(a.address),
    suburb: str(a.suburb),
    city: str(a.city),
    province: str(a.province) || undefined,
    postalCode: str(a.postalcode) || str(a.postalCode),
    businessHours: str(a.businessHours) || str(a.openingHours),
  };
}

export async function searchPickupPoints(query: string): Promise<{ points: PickupPoint[]; source: "pargo" | "demo" }> {
  const cfg = await getPargoConfig();
  if (!cfg.configured) {
    if (cfg.environment === "live") throw new Error("Pargo is set to live but no API credentials are configured.");
    return { points: searchDemoPoints(query), source: "demo" };
  }
  const data = await pargoFetch(cfg, `/pickup_points?search=${encodeURIComponent(query)}`);
  const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? (data as unknown[]) : [];
  const points = list.map(normalizePickupPoint).filter((p): p is PickupPoint => p !== null).slice(0, 20);
  return { points, source: "pargo" };
}

export interface ShipmentOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  deliveryMethod: "PARGO_PICKUP_POINT" | "PARGO_COURIER_DOOR" | "STANDARD_COURIER";
  pargoPointId: string | null;
  shippingAddress: unknown;
}

function findTrackingCode(value: unknown, depth = 0): string | null {
  if (!value || typeof value !== "object" || depth > 4) return null;
  const obj = value as Record<string, unknown>;
  for (const key of ["trackingCode", "tracking_code", "waybill", "waybillNumber", "waybill_number", "orderNumber"]) {
    if (typeof obj[key] === "string" && obj[key]) return obj[key] as string;
  }
  for (const v of Object.values(obj)) {
    const found = findTrackingCode(v, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Creates a Pargo shipment and returns the waybill / tracking code. */
export async function createPargoShipment(order: ShipmentOrder): Promise<{ waybill: string }> {
  const cfg = await getPargoConfig();
  if (!cfg.configured) throw new Error("Pargo API credentials are not configured (Admin → Settings).");

  const [firstName, ...rest] = order.customerName.split(" ");
  const address = (order.shippingAddress ?? {}) as Record<string, string>;
  const toPoint = order.deliveryMethod === "PARGO_PICKUP_POINT";

  const body = {
    data: {
      type: toPoint ? "W2P" : "W2D", // warehouse → pickup point / door
      version: 1,
      attributes: {
        externalReference: order.orderNumber,
        pickupPointCode: toPoint ? order.pargoPointId : undefined,
        consignee: {
          firstName,
          lastName: rest.join(" "),
          email: order.customerEmail,
          phoneNumbers: order.customerPhone ? [order.customerPhone] : [],
          ...(toPoint
            ? {}
            : {
                address1: address.street,
                suburb: address.suburb,
                city: address.city,
                province: address.province,
                postalCode: address.postalCode,
                country: "ZA",
              }),
        },
      },
    },
  };

  const data = await pargoFetch(cfg, "/orders", { method: "POST", body: JSON.stringify(body) });
  const waybill = findTrackingCode(data);
  if (!waybill) throw new Error("Pargo accepted the order but returned no tracking code.");
  return { waybill };
}

// ─── Sandbox demo pickup points (used only while Pargo isn't configured) ───

export const DEMO_PICKUP_POINTS: PickupPoint[] = [
  { id: "DEMO-JHB-001", name: "Clicks - Rosebank Mall", address: "50 Bath Ave, Shop 12", suburb: "Rosebank", city: "Johannesburg", province: "Gauteng", postalCode: "2196", businessHours: "Mon–Fri 09:00–19:00, Sat 09:00–17:00, Sun 09:00–15:00" },
  { id: "DEMO-JHB-002", name: "FreshStop - Sandton Drive", address: "112 Sandton Dr", suburb: "Sandton", city: "Johannesburg", province: "Gauteng", postalCode: "2196", businessHours: "Daily 06:00–21:00" },
  { id: "DEMO-JHB-003", name: "Clicks - Fourways Mall", address: "Cnr William Nicol & Witkoppen Rd", suburb: "Fourways", city: "Johannesburg", province: "Gauteng", postalCode: "2191", businessHours: "Mon–Sat 09:00–19:00, Sun 09:00–17:00" },
  { id: "DEMO-JHB-004", name: "Clicks - Maponya Mall", address: "2127 Chris Hani Rd", suburb: "Soweto", city: "Johannesburg", province: "Gauteng", postalCode: "1809", businessHours: "Mon–Sat 09:00–18:00, Sun 09:00–15:00" },
  { id: "DEMO-PTA-001", name: "Clicks - Menlyn Park", address: "Atterbury Rd, Shop G45", suburb: "Menlyn", city: "Pretoria", province: "Gauteng", postalCode: "0181", businessHours: "Mon–Sat 09:00–19:00, Sun 09:00–17:00" },
  { id: "DEMO-PTA-002", name: "FreshStop - Hatfield", address: "1122 Burnett St", suburb: "Hatfield", city: "Pretoria", province: "Gauteng", postalCode: "0083", businessHours: "Daily 06:00–22:00" },
  { id: "DEMO-CPT-001", name: "Clicks - V&A Waterfront", address: "19 Dock Rd, Victoria Wharf", suburb: "V&A Waterfront", city: "Cape Town", province: "Western Cape", postalCode: "8001", businessHours: "Daily 09:00–21:00" },
  { id: "DEMO-CPT-002", name: "FreshStop - Sea Point", address: "201 Main Rd", suburb: "Sea Point", city: "Cape Town", province: "Western Cape", postalCode: "8005", businessHours: "Daily 06:00–22:00" },
  { id: "DEMO-CPT-003", name: "Clicks - Canal Walk", address: "Century Blvd, Shop 221", suburb: "Century City", city: "Cape Town", province: "Western Cape", postalCode: "7441", businessHours: "Daily 09:00–21:00" },
  { id: "DEMO-CPT-004", name: "Clicks - Stellenbosch Square", address: "Cnr R44 & Jamestown Rd", suburb: "Stellenbosch", city: "Stellenbosch", province: "Western Cape", postalCode: "7600", businessHours: "Mon–Sat 09:00–19:00, Sun 09:00–14:00" },
  { id: "DEMO-DUR-001", name: "Clicks - Gateway Theatre of Shopping", address: "1 Palm Blvd", suburb: "Umhlanga", city: "Durban", province: "KwaZulu-Natal", postalCode: "4319", businessHours: "Daily 09:00–19:00" },
  { id: "DEMO-DUR-002", name: "FreshStop - Musgrave", address: "115 Musgrave Rd", suburb: "Berea", city: "Durban", province: "KwaZulu-Natal", postalCode: "4001", businessHours: "Daily 06:00–21:00" },
  { id: "DEMO-PMB-001", name: "Clicks - Liberty Midlands Mall", address: "50 Sanctuary Rd", suburb: "Chase Valley", city: "Pietermaritzburg", province: "KwaZulu-Natal", postalCode: "3201", businessHours: "Mon–Sat 09:00–18:00, Sun 09:00–15:00" },
  { id: "DEMO-GQB-001", name: "Clicks - Baywest Mall", address: "100 Baywest Blvd", suburb: "Hunters Retreat", city: "Gqeberha", province: "Eastern Cape", postalCode: "6025", businessHours: "Mon–Sat 09:00–19:00, Sun 09:00–15:00" },
  { id: "DEMO-BFN-001", name: "Clicks - Mimosa Mall", address: "131 Kellner St", suburb: "Brandwag", city: "Bloemfontein", province: "Free State", postalCode: "9301", businessHours: "Mon–Sat 09:00–18:00, Sun 09:00–14:00" },
  { id: "DEMO-MBO-001", name: "Clicks - Riverside Mall", address: "Madiba Dr", suburb: "Riverside Park", city: "Mbombela", province: "Mpumalanga", postalCode: "1200", businessHours: "Mon–Sat 09:00–18:00, Sun 09:00–14:00" },
  { id: "DEMO-PLK-001", name: "Clicks - Mall of the North", address: "Cnr N1 & R81", suburb: "Bendor", city: "Polokwane", province: "Limpopo", postalCode: "0699", businessHours: "Mon–Sat 09:00–18:00, Sun 09:00–14:00" },
  { id: "DEMO-RTB-001", name: "FreshStop - Rustenburg Waterfall", address: "Augrabies Ave", suburb: "Waterfall East", city: "Rustenburg", province: "North West", postalCode: "0299", businessHours: "Daily 06:00–21:00" },
  { id: "DEMO-KIM-001", name: "Clicks - Diamond Pavilion", address: "Cnr Bultfontein & Oliver Rd", suburb: "Kimberley Central", city: "Kimberley", province: "Northern Cape", postalCode: "8301", businessHours: "Mon–Sat 09:00–18:00, Sun 09:00–14:00" },
];

function searchDemoPoints(query: string): PickupPoint[] {
  const q = query.trim().toLowerCase();
  const matches = DEMO_PICKUP_POINTS.filter((p) =>
    [p.name, p.suburb, p.city, p.province ?? "", p.postalCode].some((field) => field.toLowerCase().includes(q)),
  );
  return matches.length ? matches : [];
}
