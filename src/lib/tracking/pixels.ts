// Zen Amour social media & commerce pixel tracker.
// Fires matching events to Meta (Facebook/Instagram), TikTok and Google Analytics 4.
// Each call is a no-op when that pixel isn't installed.

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    ttq?: { track: (...args: any[]) => void; page: () => void; [key: string]: any };
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const CURRENCY = "ZAR";

export interface TrackedProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  quantity?: number;
  variant?: string | null;
}

function ga4Item(p: TrackedProduct) {
  return {
    item_id: p.id,
    item_name: p.name,
    item_category: p.category,
    item_variant: p.variant ?? undefined,
    price: p.price,
    quantity: p.quantity ?? 1,
  };
}

export function trackPageView() {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "PageView");
  window.ttq?.page();
  window.gtag?.("event", "page_view", { page_location: window.location.href, page_title: document.title });
}

/** Product page view. */
export function trackProductView(product: TrackedProduct) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "ViewContent", {
    content_name: product.name,
    content_ids: [product.id],
    content_type: "product",
    content_category: product.category,
    value: product.price,
    currency: CURRENCY,
  });
  window.ttq?.track("ViewContent", {
    content_id: product.id,
    content_type: "product",
    content_name: product.name,
    value: product.price,
    currency: CURRENCY,
  });
  window.gtag?.("event", "view_item", { currency: CURRENCY, value: product.price, items: [ga4Item(product)] });
}

export function trackAddToCart(product: TrackedProduct & { quantity: number }) {
  if (typeof window === "undefined") return;
  const value = product.price * product.quantity;
  window.fbq?.("track", "AddToCart", {
    content_name: product.name,
    content_ids: [product.id],
    content_type: "product",
    value,
    currency: CURRENCY,
  });
  window.ttq?.track("AddToCart", {
    content_id: product.id,
    content_type: "product",
    content_name: product.name,
    quantity: product.quantity,
    value,
    currency: CURRENCY,
  });
  window.gtag?.("event", "add_to_cart", { currency: CURRENCY, value, items: [ga4Item(product)] });
}

export function trackInitiateCheckout(cart: { value: number; items: TrackedProduct[] }) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", "InitiateCheckout", {
    value: cart.value,
    currency: CURRENCY,
    num_items: cart.items.reduce((n, i) => n + (i.quantity ?? 1), 0),
    content_ids: cart.items.map((i) => i.id),
  });
  window.ttq?.track("InitiateCheckout", { value: cart.value, currency: CURRENCY });
  window.gtag?.("event", "begin_checkout", { currency: CURRENCY, value: cart.value, items: cart.items.map(ga4Item) });
}

/** Purchase completion. Guarded so a page refresh can't double count. */
export function trackPurchase(order: { orderId: string; total: number; shipping?: number; items: TrackedProduct[] }) {
  if (typeof window === "undefined") return;
  const key = `za_tracked_${order.orderId}`;
  try {
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    /* storage unavailable — track anyway */
  }

  window.fbq?.(
    "track",
    "Purchase",
    {
      value: order.total,
      currency: CURRENCY,
      contents: order.items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1 })),
      content_type: "product",
    },
    { eventID: order.orderId },
  );
  window.ttq?.track("CompletePayment", {
    content_id: order.orderId,
    contents: order.items.map((i) => ({ content_id: i.id, quantity: i.quantity ?? 1, price: i.price })),
    value: order.total,
    currency: CURRENCY,
  });
  window.gtag?.("event", "purchase", {
    transaction_id: order.orderId,
    currency: CURRENCY,
    value: order.total,
    shipping: order.shipping ?? 0,
    items: order.items.map(ga4Item),
  });
}

// Pixel IDs are injected into inline scripts, so only well-formed IDs are allowed.
export const PIXEL_ID_PATTERNS = {
  metaPixelId: /^\d{6,20}$/,
  tiktokPixelId: /^[A-Z0-9]{8,30}$/i,
  ga4MeasurementId: /^G-[A-Z0-9]{4,16}$/i,
  googleTagManagerId: /^GTM-[A-Z0-9]{4,12}$/i,
} as const;

export function safePixelId(id: string | null | undefined, pattern: RegExp): string | null {
  return id && pattern.test(id) ? id : null;
}
