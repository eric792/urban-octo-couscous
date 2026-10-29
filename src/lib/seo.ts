import { STORE_NAME } from "@/lib/constants";
import type { StoreConfig } from "@/lib/settings";
import { absoluteUrl, formatZAR, parseScentNotes } from "@/lib/utils";
import type { ProductDetailDTO } from "@/types";

export const DEFAULT_OG_IMAGE = "/opengraph-image";

/** Social networks can't render SVG, so fall back to the site OG image. */
export function socialImage(images: string[]): string {
  const raster = images.find((src) => !src.toLowerCase().split("?")[0].endsWith(".svg"));
  return raster ?? DEFAULT_OG_IMAGE;
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

function listSizes(product: ProductDetailDTO): string {
  const sizes = product.variants.map((v) => v.volume).filter(Boolean) as string[];
  if (sizes.length <= 1) return sizes[0] ?? "";
  return `${sizes.slice(0, -1).join(", ")} & ${sizes[sizes.length - 1]}`;
}

/** Title without the "| Zen Amour" suffix (the layout template adds it). */
export function productTitle(product: ProductDetailDTO): string {
  if (product.seoTitle) return product.seoTitle;
  let base: string;
  if (product.concentration) {
    const firstWord = product.concentration.split(" ")[0].toLowerCase();
    base = product.name.toLowerCase().includes(firstWord)
      ? `${product.name} — ${product.scentFamily ? `${product.scentFamily} ` : ""}Perfume`
      : `${product.name} ${product.concentration}`;
  } else {
    base = `${product.name} — ${product.category.name}`;
  }
  const inspired = product.inspiredBy ? ` — Inspired by ${product.inspiredBy}` : "";
  return clip(`${base}${inspired}`, 60 - ` | ${STORE_NAME}`.length);
}

export function productDescription(product: ProductDetailDTO): string {
  if (product.seoDescription) return product.seoDescription;
  const notes = parseScentNotes(product.scentNotes)
    .flatMap((n) => n.notes.split(",").map((s) => s.trim()))
    .slice(0, 3)
    .join(", ")
    .toLowerCase();
  const parts = [
    product.tagline ? `${product.name}: ${product.tagline.charAt(0).toLowerCase()}${product.tagline.slice(1)}.` : `${product.name}.`,
    notes ? `Notes of ${notes}.` : "",
    `${listSizes(product)} from ${formatZAR(product.minPrice).replace(" ", "")}.`,
    "Delivered across South Africa.",
  ];
  return clip(parts.filter(Boolean).join(" ").replace(/\s+/g, " "), 155);
}

export function productJsonLd(product: ProductDetailDTO, settings: StoreConfig) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const shipping = {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: settings.pargoPickupFee, currency: "ZAR" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "ZA" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 4, unitCode: "DAY" },
    },
  };
  const returns = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "ZA",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((src) => (src.startsWith("http") ? src : absoluteUrl(src))),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: STORE_NAME },
    category: product.category.name,
    ...(product.scentFamily && {
      additionalProperty: [
        { "@type": "PropertyValue", name: "Scent family", value: product.scentFamily },
        ...(product.concentration ? [{ "@type": "PropertyValue", name: "Concentration", value: product.concentration }] : []),
      ],
    }),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: v.volume ? `${product.name} ${v.volume}` : product.name,
      price: v.price.toFixed(2),
      priceCurrency: "ZAR",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url,
      seller: { "@type": "Organization", name: STORE_NAME },
      shippingDetails: shipping,
      hasMerchantReturnPolicy: returns,
    })),
    ...(product.rating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.toFixed(1),
        reviewCount: product.reviewCount,
        bestRating: 5,
      },
      review: product.reviews.slice(0, 5).map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        author: { "@type": "Person", name: r.author },
        datePublished: r.createdAt.slice(0, 10),
        reviewBody: r.comment,
      })),
    }),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
