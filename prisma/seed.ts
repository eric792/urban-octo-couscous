/* Zen Amour seed: catalogue, journal, discount codes, admin user and (optional) demo orders.
 * Run with `npm run db:seed`. Safe to re-run: catalogue rows are upserted by slug / SKU. */
import { PrismaClient, type DeliveryMethod, type OrderStatus, type PaymentGateway } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { CATEGORY_SEO, PRODUCT_ATTRIBUTES } from "./seo-content";

const db = new PrismaClient();

const SAHPRA =
  "This unregistered medicine has not been evaluated by SAHPRA for its quality, safety or intended use. Not intended to diagnose, treat, cure or prevent any disease. Consult your healthcare provider if you are pregnant, breastfeeding or on medication.";

type SeedVariant = { volume: string; price: number; compare?: number; stock: number };
type SeedProduct = {
  slug: string;
  name: string;
  category: "fragrances" | "skincare" | "wellness";
  tagline: string;
  description: string;
  scentNotes?: string;
  featured?: boolean;
  sku: string;
  variants: SeedVariant[];
};

const CATEGORIES = [
  { slug: "fragrances", name: "Fragrances", description: "Inspired alternative fragrances in rich, long-lasting concentrations.", sortOrder: 1 },
  { slug: "skincare", name: "Skincare", description: "High-efficacy formulas built on proven actives.", sortOrder: 2 },
  { slug: "wellness", name: "Wellness", description: "Daily rituals for calm, deep sleep and lasting glow.", sortOrder: 3 },
];

const perfume = (p30: number, p50: number, p100: number, stock: [number, number, number], compare50?: number): SeedVariant[] => [
  { volume: "30ml", price: p30, stock: stock[0] },
  { volume: "50ml", price: p50, compare: compare50, stock: stock[1] },
  { volume: "100ml", price: p100, stock: stock[2] },
];

const PRODUCTS: SeedProduct[] = [
  {
    slug: "oud-royale",
    name: "Oud Royale",
    category: "fragrances",
    tagline: "Smoked oud, saffron & Damask rose",
    sku: "OUD",
    featured: true,
    scentNotes: "Top: Saffron, Pink Pepper | Heart: Damask Rose, Leather | Base: Agarwood, Amber, Sandalwood",
    description:
      "A regal, smouldering oud inspired by the most coveted niche fragrances of the Gulf. Saffron and pink pepper spark the opening before a velvet heart of Damask rose and soft leather.\n\nThe dry-down is deep agarwood, warm amber and creamy sandalwood that stays on skin well into the evening. An extrait de parfum for evenings, weddings and every moment you want to be remembered.",
    variants: perfume(349, 499, 799, [24, 40, 18], 599),
  },
  {
    slug: "velvet-musk",
    name: "Velvet Musk",
    category: "fragrances",
    tagline: "Clean musk wrapped in cashmere",
    sku: "VMU",
    featured: true,
    scentNotes: "Top: Bergamot, Pear | Heart: Iris, White Musk | Base: Cashmeran, Vanilla",
    description:
      "Your skin, but better. Velvet Musk is a soft, intimate signature built on airy white musks and powdery iris, brightened with bergamot and juicy pear.\n\nCashmeran and a whisper of vanilla make it feel like your favourite knit — effortless from the office to Sunday brunch.",
    variants: perfume(299, 449, 699, [30, 52, 20]),
  },
  {
    slug: "amber-saffron-extrait",
    name: "Amber Saffron Extrait",
    category: "fragrances",
    tagline: "Our most-requested signature",
    sku: "ASE",
    featured: true,
    scentNotes: "Top: Saffron, Jasmine | Heart: Amberwood, Ambergris | Base: Fir Resin, Cedar",
    description:
      "Luminous, addictive and endlessly complimented. Saffron and jasmine glow over a mineral amberwood accord, finished with fir resin and cedar for a trail that fills a room.\n\nInspired by one of the world's most iconic luxury extraits — reinterpreted as an extrait at a fraction of the price.",
    variants: perfume(399, 549, 849, [15, 36, 12], 649),
  },
  {
    slug: "fleur-de-nuit",
    name: "Fleur de Nuit",
    category: "fragrances",
    tagline: "Night-blooming tuberose & jasmine",
    sku: "FDN",
    scentNotes: "Top: Blackcurrant, Mandarin | Heart: Tuberose, Jasmine Sambac | Base: Patchouli, Tonka Bean",
    description:
      "A seductive white floral that blooms after dark. Juicy blackcurrant and mandarin open onto heady tuberose and jasmine sambac.\n\nPatchouli and tonka bean give it a warm, sensual trail — made for date nights and dinners that run late.",
    variants: perfume(299, 449, 699, [20, 28, 10]),
  },
  {
    slug: "cedar-sea-salt",
    name: "Cedar & Sea Salt",
    category: "fragrances",
    tagline: "Fresh, coastal, effortless",
    sku: "CSS",
    featured: true,
    scentNotes: "Top: Sea Salt, Grapefruit | Heart: Sage, Ambrette | Base: Cedarwood, Driftwood",
    description:
      "Bottled Cape coastline. Mineral sea salt and pink grapefruit meet aromatic sage, settling into dry cedar and sun-bleached driftwood.\n\nA unisex fresh scent that performs beautifully in South African summer heat.",
    variants: perfume(299, 449, 699, [26, 44, 16]),
  },
  {
    slug: "rose-noir",
    name: "Rose Noir",
    category: "fragrances",
    tagline: "Dark rose, oud & incense",
    sku: "RNR",
    scentNotes: "Top: Raspberry, Clove | Heart: Turkish Rose | Base: Oud, Incense, Vanilla",
    description:
      "The rose, reimagined in shadow. Tart raspberry and clove set the stage for a lush Turkish rose, deepened with oud and smoky incense.\n\nRich vanilla rounds it into a long-lasting, statement-making fragrance for cooler evenings.",
    variants: perfume(349, 499, 799, [0, 14, 9]),
  },
  {
    slug: "niacinamide-glow-serum",
    name: "Niacinamide Glow Serum",
    category: "skincare",
    tagline: "10% niacinamide + 1% zinc for refined pores",
    sku: "NGS",
    featured: true,
    description:
      "A lightweight daily serum that visibly refines pores, balances oil and evens skin tone. 10% niacinamide is paired with 1% zinc PCA and soothing panthenol.\n\nApply 3–4 drops morning and evening after cleansing. Suitable for all skin types, including oily and blemish-prone skin.",
    variants: [
      { volume: "30ml", price: 425, stock: 60 },
      { volume: "60ml", price: 695, compare: 850, stock: 25 },
    ],
  },
  {
    slug: "vitamin-c-radiance-drops",
    name: "Vitamin C Radiance Drops",
    category: "skincare",
    tagline: "15% vitamin C with ferulic acid",
    sku: "VCR",
    description:
      "A brightening antioxidant serum with 15% stabilised vitamin C, vitamin E and ferulic acid to target dullness and uneven tone, and to defend against daily environmental stress.\n\nUse in the morning before moisturiser and always follow with SPF.",
    variants: [{ volume: "30ml", price: 449, stock: 34 }],
  },
  {
    slug: "hyaluronic-dew-moisturiser",
    name: "Hyaluronic Dew Moisturiser",
    category: "skincare",
    tagline: "Weightless gel-cream for all-day hydration",
    sku: "HDM",
    description:
      "A bouncy gel-cream with multi-weight hyaluronic acid, squalane and ceramides that floods skin with moisture and strengthens the skin barrier — without any heaviness.\n\nIdeal under make-up and perfect for humid coastal climates.",
    variants: [{ volume: "50ml", price: 395, stock: 48 }],
  },
  {
    slug: "rooibos-recovery-night-cream",
    name: "Rooibos Recovery Night Cream",
    category: "skincare",
    tagline: "Proudly South African rooibos + peptides",
    sku: "RRN",
    featured: true,
    description:
      "An indulgent overnight cream powered by antioxidant-rich rooibos extract, firming peptides and shea butter. Wake up to skin that looks rested, plump and calm.\n\nMassage a pea-sized amount into face and neck as the last step of your evening ritual.",
    variants: [{ volume: "50ml", price: 465, stock: 22 }],
  },
  {
    slug: "marula-facial-oil",
    name: "Marula Facial Oil",
    category: "skincare",
    tagline: "Cold-pressed, fast-absorbing nourishment",
    sku: "MFO",
    description:
      "Pure cold-pressed marula oil — rich in omega fatty acids and antioxidants — sinks in quickly to nourish and soften without clogging pores.\n\nPress 2–3 drops into skin at night, or mix with your moisturiser for an instant glow.",
    variants: [{ volume: "30ml", price: 385, stock: 30 }],
  },
  {
    slug: "marine-collagen-elixir",
    name: "Marine Collagen Elixir",
    category: "wellness",
    tagline: "10g hydrolysed marine collagen + vitamin C",
    sku: "MCE",
    featured: true,
    description:
      `Unflavoured sachets of 10g hydrolysed marine collagen peptides with vitamin C, which contributes to normal collagen formation. Dissolves instantly into coffee, smoothies or water.\n\nTake one sachet daily. ${SAHPRA}`,
    variants: [
      { volume: "30 sachets", price: 549, stock: 40 },
      { volume: "60 sachets", price: 999, compare: 1098, stock: 18 },
    ],
  },
  {
    slug: "ashwagandha-calm-capsules",
    name: "Ashwagandha Calm Capsules",
    category: "wellness",
    tagline: "Standardised ashwagandha root for everyday balance",
    sku: "ACC",
    description:
      `A traditional adaptogen to support your body through busy, demanding days. Each vegan capsule contains 300mg ashwagandha root extract.\n\nTake one to two capsules daily with food. ${SAHPRA}`,
    variants: [{ volume: "60 capsules", price: 329, stock: 36 }],
  },
  {
    slug: "magnesium-sleep-ritual",
    name: "Magnesium Sleep Ritual",
    category: "wellness",
    tagline: "Magnesium glycinate + L-theanine",
    sku: "MSR",
    featured: true,
    description:
      `A gentle evening blend of highly absorbable magnesium glycinate with L-theanine and chamomile to help you unwind. Magnesium contributes to normal functioning of the nervous system.\n\nTake two capsules 30 minutes before bed. ${SAHPRA}`,
    variants: [{ volume: "60 capsules", price: 299, stock: 3 }],
  },
];

const POSTS = [
  {
    slug: "how-to-layer-fragrance",
    title: "How to Layer Fragrance for All-Day Wear",
    excerpt: "The art of combining scents so your signature lasts from your morning commute to dinner.",
    content: `Layering is how perfumers' favourite clients make a fragrance entirely their own. Done well, it adds depth and keeps your scent on skin for hours longer.

## Start with a hydrated canvas

Fragrance clings to moisture. Apply an unscented body lotion or a drop of [Marula Facial Oil](/product/marula-facial-oil) to pulse points before you spray.

## Heavy before light

Apply the richer scent first, then the lighter one on top. Try **Oud Royale** beneath **Velvet Musk** — the musk softens the oud into something intimate and modern.

## Our favourite pairings

- Amber Saffron Extrait + Cedar & Sea Salt for a bright, mineral glow
- Fleur de Nuit + Velvet Musk for a creamy, romantic floral
- Rose Noir + Oud Royale for maximum evening drama

> Spray, don't rub. Rubbing your wrists breaks down the top notes.

## Where to apply

Pulse points warm the fragrance and help it radiate: inner wrists, behind the ears, the base of the throat and the inner elbows. A mist over your hair (from a distance) gives a beautiful trail.`,
    daysAgo: 4,
  },
  {
    slug: "niacinamide-101",
    title: "Niacinamide 101: Your Guide to a Brighter Complexion",
    excerpt: "Why this multitasking vitamin is the most-loved active in skincare — and how to use it.",
    content: `Niacinamide (vitamin B3) is one of the few actives that suits almost every skin type. It's gentle, well-researched and plays nicely with most of your routine.

## What it does

- Helps refine the look of enlarged pores
- Balances oil production through the day
- Supports a healthy skin barrier
- Visibly evens tone and post-blemish marks over time

## How to use it

Apply 3–4 drops of [Niacinamide Glow Serum](/product/niacinamide-glow-serum) after cleansing, morning and night. Follow with a moisturiser such as **Hyaluronic Dew** and, in the morning, sunscreen.

## Can I use it with vitamin C?

Yes. Modern formulations are stable together. If you're sensitive, use vitamin C in the morning and niacinamide in the evening.

> Consistency beats intensity. Give any new active six to eight weeks.`,
    daysAgo: 11,
  },
  {
    slug: "signature-scent-south-african-summer",
    title: "Choosing a Signature Scent for the South African Summer",
    excerpt: "Heat changes how fragrance behaves. Here's how to choose a scent that thrives from Durban to Cape Town.",
    content: `Hot, humid days amplify fragrance — sweet, heavy scents can become cloying, while fresh notes can disappear in an hour. The trick is choosing the right structure.

## Look for luminous bases

Mineral, woody and ambery bases keep freshness alive for longer. **Cedar & Sea Salt** and **Amber Saffron Extrait** were both built to perform in warm weather.

## Go lighter on the trigger

Two sprays are plenty in 30°C heat. Save the third for evenings.

## Keep it cool

Store your bottles away from sunlight and car dashboards — heat breaks down fragrance oils faster than anything else.

Shop our [fragrance collection](/shop/fragrances) to find your summer signature.`,
    daysAgo: 19,
  },
  {
    slug: "evening-wind-down-rituals",
    title: "The Evening Wind-Down: Rituals for Better Sleep",
    excerpt: "Simple, sensory habits that tell your body it's time to rest.",
    content: `Good sleep starts long before your head hits the pillow. A consistent wind-down ritual signals to your nervous system that the day is done.

## Dim the lights an hour before bed

Bright light delays melatonin. Switch to lamps and put your phone on night mode.

## Make skincare a ritual, not a chore

Massaging in **Rooibos Recovery Night Cream** with slow, upward strokes is a two-minute meditation.

## Support your body

Many people find magnesium part of a calming routine. Our [Magnesium Sleep Ritual](/product/magnesium-sleep-ritual) pairs magnesium glycinate with L-theanine and chamomile.

## Scent the space

A single spritz of **Velvet Musk** on your pillowcase is soft enough to drift off to.`,
    daysAgo: 27,
  },
];

const CUSTOMERS = [
  ["Sipho Dlamini", "sipho@example.co.za", "Gauteng", "Johannesburg"],
  ["Chanel van der Merwe", "chanel@example.co.za", "Western Cape", "Cape Town"],
  ["Kirsty Smith", "kirsty@example.co.za", "KwaZulu-Natal", "Durban"],
  ["Thandiwe Mokoena", "thandi@example.co.za", "Gauteng", "Pretoria"],
  ["Aisha Patel", "aisha@example.co.za", "KwaZulu-Natal", "Durban"],
  ["Lerato Nkosi", "lerato@example.co.za", "Gauteng", "Johannesburg"],
  ["Pieter Botha", "pieter@example.co.za", "Western Cape", "Stellenbosch"],
  ["Naledi Khumalo", "naledi@example.co.za", "Free State", "Bloemfontein"],
  ["Ayanda Zulu", "ayanda@example.co.za", "Eastern Cape", "Gqeberha"],
  ["Megan Jacobs", "megan@example.co.za", "Western Cape", "Cape Town"],
] as const;

const REVIEWS: [string, number, string, number][] = [
  ["oud-royale", 0, "I get stopped and asked what I'm wearing every single time. Lasts all day and night on me.", 5],
  ["oud-royale", 6, "Rich and smoky without being overpowering. Unbelievable for the price.", 5],
  ["oud-royale", 4, "Beautiful scent, packaging feels like a R3,000 bottle. Took one day extra to arrive.", 4],
  ["velvet-musk", 1, "My new everyday scent. Soft, clean and my husband loves it.", 5],
  ["velvet-musk", 5, "Subtle and elegant — perfect for the office.", 5],
  ["amber-saffron-extrait", 2, "Honestly identical to the designer one I used to buy. Projection is insane.", 5],
  ["amber-saffron-extrait", 3, "Got the 100ml after trying the 30ml. Obsessed.", 5],
  ["amber-saffron-extrait", 8, "Lovely but strong — one spray is enough!", 4],
  ["cedar-sea-salt", 6, "Smells like a holiday in Hermanus. Great in the heat.", 5],
  ["fleur-de-nuit", 9, "Gorgeous evening floral. A little sweet for daytime.", 4],
  ["niacinamide-glow-serum", 3, "My pores look so much smaller after a month. Repurchasing.", 5],
  ["niacinamide-glow-serum", 4, "Light texture, no pilling under sunscreen.", 5],
  ["rooibos-recovery-night-cream", 1, "Love that it's a local ingredient. Skin feels plump in the morning.", 5],
  ["hyaluronic-dew-moisturiser", 7, "Perfect for Durban humidity, sinks right in.", 4],
  ["marine-collagen-elixir", 5, "Dissolves perfectly in my morning coffee, no taste at all.", 5],
  ["magnesium-sleep-ritual", 0, "Part of my bedtime routine now. Lovely product.", 5],
];

// Small deterministic PRNG so demo data is stable between runs.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

async function main() {
  console.log("Seeding Zen Amour…");

  // Categories
  const categoryIds: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const seo = CATEGORY_SEO[c.slug] ?? {};
    const row = await db.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, ...seo },
      create: { ...c, ...seo },
    });
    categoryIds[c.slug] = row.id;
  }

  // Products & variants
  for (const p of PRODUCTS) {
    const data = {
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      scentNotes: p.scentNotes ?? null,
      concentration: PRODUCT_ATTRIBUTES[p.slug]?.concentration ?? null,
      scentFamily: PRODUCT_ATTRIBUTES[p.slug]?.scentFamily ?? null,
      categoryId: categoryIds[p.category],
      images: [`/images/products/${p.slug}.svg`, `/images/products/${p.slug}-2.svg`],
      isFeatured: Boolean(p.featured),
      isActive: true,
    };
    const product = await db.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    for (const [i, v] of p.variants.entries()) {
      const sku = `ZA-${p.sku}-${v.volume.replace(/[^0-9a-z]/gi, "").toUpperCase()}`;
      const variant = {
        productId: product.id,
        volume: v.volume,
        price: v.price,
        comparePrice: v.compare ?? null,
        sortOrder: i,
      };
      await db.productVariant.upsert({
        where: { sku },
        update: variant,
        create: { sku, ...variant, stock: v.stock },
      });
    }
  }

  // Journal
  for (const post of POSTS) {
    const createdAt = new Date(Date.now() - post.daysAgo * 86_400_000);
    const data = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: `/images/blog/${post.slug}.svg`,
      published: true,
    };
    await db.blogPost.upsert({ where: { slug: post.slug }, update: data, create: { slug: post.slug, ...data, createdAt } });
  }

  // Discount codes
  const codes = [
    { code: "WELCOME10", description: "10% off first order (newsletter)", type: "PERCENTAGE" as const, value: 10, minSubtotal: 300 },
    { code: "FREESHIP", description: "Free delivery on orders over R400", type: "FREE_SHIPPING" as const, value: 0, minSubtotal: 400 },
    { code: "ZEN100", description: "R100 off orders over R1,000", type: "FIXED_AMOUNT" as const, value: 100, minSubtotal: 1000, maxUses: 200 },
  ];
  for (const c of codes) {
    await db.discountCode.upsert({ where: { code: c.code }, update: {}, create: c });
  }

  // Store settings
  await db.storeSettings.upsert({
    where: { id: "default_settings" },
    update: {},
    create: {
      id: "default_settings",
      announcement: "Free nationwide delivery on orders over R750 · Pay securely with Yoco & Payfast",
      contactEmail: "hello@zenamour.co.za",
    },
  });

  // Admin
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@zenamour.co.za").toLowerCase();
  let adminPassword = process.env.SEED_ADMIN_PASSWORD;
  let generated = false;
  if (!adminPassword) {
    adminPassword = crypto.randomBytes(12).toString("base64url");
    generated = true;
  }
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: adminEmail,
        fullName: "Zen Amour Admin",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(adminPassword, 12),
      },
    });
    console.log(`Admin created: ${adminEmail}${generated ? ` / password: ${adminPassword}  (save this now)` : ""}`);
  } else {
    console.log(`Admin ${adminEmail} already exists — password unchanged.`);
  }

  const demo = (process.env.SEED_DEMO_DATA ?? process.env.SEED_DEMO_ORDERS) !== "false";
  if (!demo) {
    console.log("Skipping demo customers, reviews and orders (SEED_DEMO_DATA=false).");
    console.log("Seed complete ✔");
    return;
  }

  // Demo customers + reviews (reviews need a user). Remove before launch: npm run db:clear-demo
  const customerIds: string[] = [];
  for (const [fullName, email] of CUSTOMERS) {
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName, role: "CUSTOMER", passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10) },
    });
    customerIds.push(user.id);
  }
  if ((await db.review.count()) === 0) {
    for (const [i, [slug, customer, comment, rating]] of REVIEWS.entries()) {
      const product = await db.product.findUnique({ where: { slug } });
      if (!product) continue;
      await db.review.create({
        data: {
          productId: product.id,
          userId: customerIds[customer],
          rating,
          comment,
          createdAt: new Date(Date.now() - (i * 2 + 1) * 86_400_000),
        },
      });
    }
  }

  // Demo orders
  if ((await db.order.count()) === 0) {
    const variants = await db.productVariant.findMany({ include: { product: true } });
    const rand = rng(42);
    const statuses: OrderStatus[] = ["DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "SHIPPED", "PROCESSING", "NEW", "NEW", "CANCELLED"];
    const gateways: PaymentGateway[] = ["YOCO", "YOCO", "PAYFAST", "PAYFAST", "EFT"];
    const methods: DeliveryMethod[] = ["PARGO_PICKUP_POINT", "PARGO_PICKUP_POINT", "PARGO_COURIER_DOOR", "STANDARD_COURIER"];
    const points = [
      ["DEMO-JHB-001", "Clicks - Rosebank Mall", "Rosebank", "Johannesburg"],
      ["DEMO-CPT-001", "Clicks - V&A Waterfront", "V&A Waterfront", "Cape Town"],
      ["DEMO-DUR-001", "Clicks - Gateway Theatre of Shopping", "Umhlanga", "Durban"],
    ];

    const fixed: { number: string; customer: number; status: OrderStatus; gateway: PaymentGateway; hoursAgo: number; picks: [string, number][] }[] = [
      { number: "ZA-1089", customer: 0, status: "PROCESSING", gateway: "YOCO", hoursAgo: 3, picks: [["ZA-OUD-100ML", 1], ["ZA-VMU-50ML", 1]] },
      { number: "ZA-1090", customer: 1, status: "NEW", gateway: "PAYFAST", hoursAgo: 1, picks: [["ZA-NGS-30ML", 2]] },
      { number: "ZA-1088", customer: 2, status: "SHIPPED", gateway: "YOCO", hoursAgo: 20, picks: [["ZA-ASE-100ML", 1], ["ZA-RRN-50ML", 1], ["ZA-MCE-30SACHETS", 1]] },
    ];

    const orders = [
      ...fixed,
      ...Array.from({ length: 26 }, (_, i) => {
        const count = 1 + Math.floor(rand() * 3);
        const picks: [string, number][] = [];
        for (let k = 0; k < count; k++) {
          const v = variants[Math.floor(rand() * variants.length)];
          if (!picks.some(([s]) => s === v.sku)) picks.push([v.sku, 1 + Math.floor(rand() * 2)]);
        }
        return {
          number: `ZA-${1087 - i}`,
          customer: Math.floor(rand() * CUSTOMERS.length),
          status: statuses[Math.floor(rand() * statuses.length)],
          gateway: gateways[Math.floor(rand() * gateways.length)],
          hoursAgo: 24 + Math.floor(rand() * 24 * 34),
          picks,
        };
      }),
    ];

    for (const o of orders) {
      const [fullName, email, province, city] = CUSTOMERS[o.customer];
      const lines = o.picks
        .map(([sku, qty]) => ({ v: variants.find((x) => x.sku === sku), qty }))
        .filter((l): l is { v: (typeof variants)[number]; qty: number } => Boolean(l.v));
      const subtotal = lines.reduce((s, l) => s + Number(l.v.price) * l.qty, 0);
      const method = methods[Math.floor(rand() * methods.length)];
      const shipping = subtotal >= 750 ? 0 : method === "PARGO_PICKUP_POINT" ? 65 : method === "PARGO_COURIER_DOOR" ? 99 : 110;
      const point = points[Math.floor(rand() * points.length)];
      const createdAt = new Date(Date.now() - o.hoursAgo * 3_600_000);
      const isPaid = o.status !== "CANCELLED";

      await db.order.create({
        data: {
          orderNumber: o.number,
          customerName: fullName,
          customerEmail: email,
          guestEmail: email,
          customerPhone: `08${Math.floor(10000000 + rand() * 89999999)}`,
          status: o.status,
          subtotal,
          shippingCost: shipping,
          totalAmount: subtotal + shipping,
          gateway: o.gateway,
          gatewayTxId: isPaid && o.gateway !== "EFT" ? `demo_${o.number}` : null,
          paidAt: isPaid ? createdAt : null,
          deliveryMethod: method,
          pargoPointId: method === "PARGO_PICKUP_POINT" ? point[0] : null,
          pargoPointName: method === "PARGO_PICKUP_POINT" ? point[1] : null,
          pargoWaybillCode: ["SHIPPED", "DELIVERED"].includes(o.status) && method !== "STANDARD_COURIER" ? `PGO${o.number.slice(3)}88` : null,
          trackingNumber: ["SHIPPED", "DELIVERED"].includes(o.status) && method === "STANDARD_COURIER" ? `CX${o.number.slice(3)}ZA` : null,
          shippingAddress:
            method === "PARGO_PICKUP_POINT"
              ? { type: "pargo_point", id: point[0], name: point[1], suburb: point[2], city: point[3] }
              : { type: "address", street: "12 Jacaranda Avenue", suburb: "Central", city, province, postalCode: "2000" },
          notes: "Demo order created by the seed script.",
          createdAt,
          items: {
            create: lines.map((l) => ({
              variantId: l.v.id,
              productName: l.v.product.name,
              variantLabel: l.v.volume,
              sku: l.v.sku,
              quantity: l.qty,
              price: l.v.price,
            })),
          },
        },
      });
    }
    for (const email of ["lerato@example.co.za", "megan@example.co.za", "zola@example.co.za"]) {
      await db.subscriber.upsert({ where: { email }, update: {}, create: { email, source: "homepage" } });
    }
    console.log(`Created ${orders.length} demo orders.`);
  }

  console.log("Seed complete ✔");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
