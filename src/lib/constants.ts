import type { DeliveryMethod, OrderStatus, PaymentGateway } from "@/types";

export const STORE_NAME = "Zen Amour";
export const LEGAL_NAME = "Zen Amour (Pty) Ltd";
export const STORE_TAGLINE = "Affordable luxury fragrances, skincare and wellness, crafted for South Africa.";

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "NEW",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  NEW: "New",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

/** Statuses that count as paid revenue. */
export const PAID_STATUSES: OrderStatus[] = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED"];

export const GATEWAY_LABELS: Record<PaymentGateway, string> = {
  YOCO: "Card (Yoco)",
  PAYFAST: "Payfast",
  EFT: "Manual EFT",
};

export const DELIVERY_OPTIONS: Record<
  DeliveryMethod,
  { label: string; short: string; description: string; eta: string }
> = {
  PARGO_PICKUP_POINT: {
    label: "Pargo Pickup Point",
    short: "Pargo pickup",
    description: "Collect from a Pargo counter near you (Clicks, FreshStop & more).",
    eta: "2–4 working days",
  },
  PARGO_COURIER_DOOR: {
    label: "Pargo Door-to-Door",
    short: "Pargo door",
    description: "Pargo courier delivers to your home or office.",
    eta: "2–4 working days",
  },
  STANDARD_COURIER: {
    label: "Standard Courier",
    short: "Courier",
    description: "Nationwide courier to your door, all 9 provinces.",
    eta: "3–5 working days",
  },
};

export const CATEGORY_LINKS = [
  { name: "Fragrances", slug: "fragrances" },
  { name: "Skincare", slug: "skincare" },
  { name: "Wellness", slug: "wellness" },
];
