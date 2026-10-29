// Plain data shapes shared by server and client components.
// Prices are numbers in rand (e.g. 499.5 = R 499.50).

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "NEW"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentGateway = "YOCO" | "PAYFAST" | "EFT";

export type DeliveryMethod = "PARGO_PICKUP_POINT" | "PARGO_COURIER_DOOR" | "STANDARD_COURIER";

export interface VariantDTO {
  id: string;
  sku: string;
  volume: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
}

export interface ProductCardDTO {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  images: string[];
  category: { name: string; slug: string };
  variants: VariantDTO[];
  isFeatured: boolean;
  rating: number | null;
  reviewCount: number;
  minPrice: number;
  createdAt: string;
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

export interface ProductDetailDTO extends ProductCardDTO {
  description: string;
  scentNotes: string | null;
  concentration: string | null;
  scentFamily: string | null;
  inspiredBy: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
  reviews: ReviewDTO[];
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  heading: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  content: string | null;
  productCount: number;
}

export interface BlogPostDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  variantLabel: string | null;
  price: number;
  image: string | null;
  quantity: number;
  maxStock: number;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  suburb: string;
  city: string;
  province?: string;
  postalCode: string;
  businessHours: string;
}

export interface QuoteLine {
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string | null;
  sku: string;
  slug: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stock: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  discountCode: string | null;
  discountMessage: string | null;
  discountError: string | null;
  freeShipping: boolean;
  amountToFreeShipping: number;
  issues: string[];
}

/** Store settings that are safe to send to the browser. */
export interface PublicSettings {
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  ga4MeasurementId: string | null;
  googleTagManagerId: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  whatsappNumber: string | null;
  contactEmail: string | null;
  announcement: string | null;
  pargoMapToken: string | null;
  pargoPickupFee: number;
  pargoDoorFee: number;
  courierFee: number;
  freeShippingThreshold: number;
  yocoEnabled: boolean;
  payfastEnabled: boolean;
  eftEnabled: boolean;
}

export interface ActionState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
}
