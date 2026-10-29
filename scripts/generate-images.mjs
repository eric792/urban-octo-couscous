// Generates on-brand placeholder artwork (SVG) for products, journal covers and the hero.
// Run: node scripts/generate-images.mjs   — replace with real photography whenever you like.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "images");
mkdirSync(join(OUT, "products"), { recursive: true });
mkdirSync(join(OUT, "blog"), { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

function defs(id, accent) {
  return `
  <defs>
    <radialGradient id="bg-${id}" cx="50%" cy="40%" r="78%">
      <stop offset="0" stop-color="${mix(accent, "#0d0d0f", 0.72)}"/>
      <stop offset="0.55" stop-color="#0c0c0e"/>
      <stop offset="1" stop-color="#050506"/>
    </radialGradient>
    <linearGradient id="gold-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7d5f2a"/>
      <stop offset="0.22" stop-color="#e9d29b"/>
      <stop offset="0.45" stop-color="#b8913f"/>
      <stop offset="0.7" stop-color="#f3e3b5"/>
      <stop offset="1" stop-color="#8c6c31"/>
    </linearGradient>
    <linearGradient id="goldv-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3e3b5"/>
      <stop offset="0.5" stop-color="#b8913f"/>
      <stop offset="1" stop-color="#7d5f2a"/>
    </linearGradient>
    <linearGradient id="liquid-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${mix(accent, "#ffffff", 0.25)}" stop-opacity="0.95"/>
      <stop offset="0.6" stop-color="${accent}" stop-opacity="0.92"/>
      <stop offset="1" stop-color="${mix(accent, "#000000", 0.45)}" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="glass-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.18" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="0.8" stop-color="#ffffff" stop-opacity="0.02"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.12"/>
    </linearGradient>
    <linearGradient id="matte-${id}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${mix(accent, "#000000", 0.55)}"/>
      <stop offset="0.35" stop-color="${mix(accent, "#000000", 0.2)}"/>
      <stop offset="0.65" stop-color="${mix(accent, "#000000", 0.35)}"/>
      <stop offset="1" stop-color="${mix(accent, "#000000", 0.7)}"/>
    </linearGradient>
    <filter id="blur-${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="glow-${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>
  </defs>`;
}

function backdrop(id, accent) {
  return `
  <rect width="800" height="1000" fill="url(#bg-${id})"/>
  <circle cx="400" cy="520" r="260" fill="${accent}" opacity="0.16" filter="url(#glow-${id})"/>
  <circle cx="400" cy="560" r="330" fill="none" stroke="url(#gold-${id})" stroke-width="1" opacity="0.35"/>
  <circle cx="400" cy="560" r="360" fill="none" stroke="url(#gold-${id})" stroke-width="0.6" opacity="0.18"/>
  <ellipse cx="400" cy="828" rx="250" ry="20" fill="#000" opacity="0.75" filter="url(#blur-${id})"/>
  <line x1="120" y1="830" x2="680" y2="830" stroke="url(#gold-${id})" stroke-width="0.8" opacity="0.35"/>`;
}

function label(id, { name, sub, x = 400, y = 600, w = 210, h = 128 }) {
  const fs = name.length > 16 ? 21 : name.length > 12 ? 24 : 27;
  return `
  <rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="4" fill="#0a0a0b" fill-opacity="0.88" stroke="url(#gold-${id})" stroke-width="1.4"/>
  <rect x="${x - w / 2 + 7}" y="${y + 7}" width="${w - 14}" height="${h - 14}" rx="2" fill="none" stroke="url(#gold-${id})" stroke-width="0.6" opacity="0.6"/>
  <text x="${x}" y="${y + 34}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="12" letter-spacing="5" fill="#d6b46c">ZEN AMOUR</text>
  <text x="${x}" y="${y + 72}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${fs}" font-style="italic" fill="#f5ecd5">${esc(name)}</text>
  <text x="${x}" y="${y + 100}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="10" letter-spacing="3.5" fill="#a7803a">${esc(sub)}</text>`;
}

const shapes = {
  flacon(id, p) {
    return `
    <rect x="365" y="352" width="70" height="56" fill="url(#gold-${id})"/>
    <rect x="322" y="214" width="156" height="146" rx="8" fill="url(#gold-${id})"/>
    <rect x="322" y="214" width="156" height="146" rx="8" fill="none" stroke="#000" stroke-opacity="0.25"/>
    <rect x="338" y="226" width="18" height="122" rx="6" fill="#fff" opacity="0.22"/>
    <rect x="245" y="400" width="310" height="420" rx="30" fill="url(#liquid-${id})"/>
    <rect x="245" y="400" width="310" height="420" rx="30" fill="url(#glass-${id})" stroke="#fff" stroke-opacity="0.28" stroke-width="2"/>
    <rect x="262" y="420" width="24" height="380" rx="12" fill="#fff" opacity="0.14"/>
    ${label(id, { name: p.label, sub: p.sub, y: 560 })}`;
  },
  orb(id, p) {
    return `
    <rect x="368" y="350" width="64" height="70" fill="url(#gold-${id})"/>
    <circle cx="400" cy="290" r="78" fill="url(#gold-${id})"/>
    <circle cx="372" cy="262" r="20" fill="#fff" opacity="0.3"/>
    <circle cx="400" cy="620" r="205" fill="url(#liquid-${id})"/>
    <circle cx="400" cy="620" r="205" fill="url(#glass-${id})" stroke="#fff" stroke-opacity="0.28" stroke-width="2"/>
    <path d="M250 560 A170 170 0 0 1 330 450" stroke="#fff" stroke-opacity="0.25" stroke-width="16" fill="none" stroke-linecap="round"/>
    ${label(id, { name: p.label, sub: p.sub, y: 572, w: 200, h: 120 })}`;
  },
  obelisk(id, p) {
    return `
    <polygon points="400,150 452,330 348,330" fill="url(#gold-${id})"/>
    <polygon points="400,150 400,330 348,330" fill="#000" opacity="0.18"/>
    <rect x="362" y="326" width="76" height="70" fill="url(#gold-${id})"/>
    <path d="M285 396 H515 L540 820 H260 Z" fill="url(#liquid-${id})"/>
    <path d="M285 396 H515 L540 820 H260 Z" fill="url(#glass-${id})" stroke="#fff" stroke-opacity="0.28" stroke-width="2"/>
    <path d="M300 420 L282 800" stroke="#fff" stroke-opacity="0.16" stroke-width="18" stroke-linecap="round"/>
    ${label(id, { name: p.label, sub: p.sub, y: 570, w: 200 })}`;
  },
  dropper(id, p) {
    return `
    <path d="M360 300 Q360 214 400 214 Q440 214 440 300 L440 380 H360 Z" fill="#141416"/>
    <path d="M372 236 Q380 222 396 220" stroke="#fff" stroke-opacity="0.25" stroke-width="6" fill="none" stroke-linecap="round"/>
    <rect x="345" y="376" width="110" height="70" rx="6" fill="url(#gold-${id})"/>
    <rect x="300" y="440" width="200" height="380" rx="28" fill="url(#liquid-${id})"/>
    <rect x="300" y="440" width="200" height="380" rx="28" fill="url(#glass-${id})" stroke="#fff" stroke-opacity="0.25" stroke-width="2"/>
    <rect x="314" y="462" width="18" height="340" rx="9" fill="#fff" opacity="0.14"/>
    ${label(id, { name: p.label, sub: p.sub, y: 580, w: 170, h: 124 })}`;
  },
  jar(id, p) {
    return `
    <rect x="215" y="556" width="370" height="78" rx="16" fill="url(#gold-${id})"/>
    ${Array.from({ length: 16 }, (_, i) => `<line x1="${236 + i * 21.5}" y1="566" x2="${236 + i * 21.5}" y2="624" stroke="#000" stroke-opacity="0.14" stroke-width="2"/>`).join("")}
    <rect x="232" y="628" width="336" height="192" rx="34" fill="url(#matte-${id})"/>
    <rect x="232" y="628" width="336" height="192" rx="34" fill="url(#glass-${id})" stroke="#fff" stroke-opacity="0.2" stroke-width="2"/>
    <rect x="250" y="642" width="20" height="160" rx="10" fill="#fff" opacity="0.12"/>
    ${label(id, { name: p.label, sub: p.sub, y: 660, w: 230, h: 124 })}`;
  },
  tub(id, p) {
    return `
    <rect x="300" y="340" width="200" height="104" rx="12" fill="#121214"/>
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${312 + i * 16}" y1="350" x2="${312 + i * 16}" y2="436" stroke="#fff" stroke-opacity="0.07" stroke-width="3"/>`).join("")}
    <rect x="300" y="340" width="200" height="14" rx="6" fill="url(#gold-${id})"/>
    <rect x="270" y="436" width="260" height="384" rx="40" fill="url(#matte-${id})"/>
    <rect x="270" y="436" width="260" height="384" rx="40" fill="url(#glass-${id})" stroke="#fff" stroke-opacity="0.18" stroke-width="2"/>
    <rect x="288" y="460" width="20" height="336" rx="10" fill="#fff" opacity="0.1"/>
    ${label(id, { name: p.label, sub: p.sub, y: 568, w: 220, h: 128 })}`;
  },
  box(id, p) {
    return `
    <polygon points="250,360 550,360 610,310 310,310" fill="${mix(p.accent, "#000000", 0.25)}"/>
    <polygon points="550,360 610,310 610,770 550,820" fill="${mix(p.accent, "#000000", 0.62)}"/>
    <rect x="250" y="360" width="300" height="460" fill="url(#matte-${id})"/>
    <rect x="250" y="360" width="300" height="460" fill="none" stroke="url(#gold-${id})" stroke-width="1.5"/>
    <line x1="250" y1="410" x2="550" y2="410" stroke="url(#gold-${id})" stroke-width="1"/>
    <line x1="250" y1="770" x2="550" y2="770" stroke="url(#gold-${id})" stroke-width="1"/>
    ${label(id, { name: p.label, sub: p.sub, y: 520, w: 230, h: 128 })}`;
  },
};

const PRODUCTS = [
  { slug: "oud-royale", label: "Oud Royale", sub: "EXTRAIT DE PARFUM", accent: "#6b3a1f", shape: "flacon" },
  { slug: "velvet-musk", label: "Velvet Musk", sub: "EAU DE PARFUM", accent: "#c9a6a0", shape: "orb" },
  { slug: "amber-saffron-extrait", label: "Amber Saffron", sub: "EXTRAIT DE PARFUM", accent: "#c2601e", shape: "obelisk" },
  { slug: "fleur-de-nuit", label: "Fleur de Nuit", sub: "EAU DE PARFUM", accent: "#5a2d5c", shape: "orb" },
  { slug: "cedar-sea-salt", label: "Cedar & Sea Salt", sub: "EAU DE PARFUM", accent: "#2f5f6b", shape: "flacon" },
  { slug: "rose-noir", label: "Rose Noir", sub: "EAU DE PARFUM", accent: "#8a1c2c", shape: "obelisk" },
  { slug: "niacinamide-glow-serum", label: "Glow Serum", sub: "10% NIACINAMIDE", accent: "#d9c7a3", shape: "dropper" },
  { slug: "vitamin-c-radiance-drops", label: "Radiance Drops", sub: "15% VITAMIN C", accent: "#e0902b", shape: "dropper" },
  { slug: "hyaluronic-dew-moisturiser", label: "Dew Moisturiser", sub: "HYALURONIC ACID", accent: "#b7c3cc", shape: "jar" },
  { slug: "rooibos-recovery-night-cream", label: "Rooibos Night", sub: "RECOVERY CREAM", accent: "#9b3d22", shape: "jar" },
  { slug: "marula-facial-oil", label: "Marula Oil", sub: "COLD-PRESSED", accent: "#c9a03c", shape: "dropper" },
  { slug: "marine-collagen-elixir", label: "Collagen Elixir", sub: "30 SACHETS", accent: "#2b4a6f", shape: "box" },
  { slug: "ashwagandha-calm-capsules", label: "Calm", sub: "ASHWAGANDHA · 60 CAPS", accent: "#4e5d3a", shape: "tub" },
  { slug: "magnesium-sleep-ritual", label: "Sleep Ritual", sub: "MAGNESIUM GLYCINATE", accent: "#3a3466", shape: "tub" },
];

function productSvg(p, variant) {
  const id = `${p.slug}-${variant}`;
  const scale = variant === 2 ? 0.78 : 1;
  const tx = variant === 2 ? 400 - 400 * scale - 70 : 0;
  const ty = variant === 2 ? 828 - 828 * scale : 0;
  const giftBox =
    variant === 2
      ? `<g>
          <rect x="500" y="560" width="190" height="262" fill="#0d0d0f" stroke="url(#gold-${id})" stroke-width="1.4"/>
          <polygon points="500,560 690,560 720,535 530,535" fill="#16161a" stroke="url(#gold-${id})" stroke-width="1"/>
          <polygon points="690,560 720,535 720,797 690,822" fill="#08080a"/>
          <text x="595" y="690" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="4" fill="#d6b46c">ZEN</text>
          <text x="595" y="712" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="4" fill="#d6b46c">AMOUR</text>
        </g>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
  ${defs(id, p.accent)}
  ${backdrop(id, p.accent)}
  ${giftBox}
  <g transform="translate(${tx} ${ty}) scale(${scale})">${shapes[p.shape](id, p)}</g>
  <text x="400" y="930" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="11" letter-spacing="6" fill="#5d4620">CRAFTED IN SOUTH AFRICA</text>
</svg>`;
}

for (const p of PRODUCTS) {
  writeFileSync(join(OUT, "products", `${p.slug}.svg`), productSvg(p, 1));
  writeFileSync(join(OUT, "products", `${p.slug}-2.svg`), productSvg(p, 2));
}

// Journal covers (16:9)
const POSTS = [
  { slug: "how-to-layer-fragrance", accent: "#c2601e", motif: "rings" },
  { slug: "niacinamide-101", accent: "#d9c7a3", motif: "drops" },
  { slug: "signature-scent-south-african-summer", accent: "#2f5f6b", motif: "sun" },
  { slug: "evening-wind-down-rituals", accent: "#3a3466", motif: "moon" },
];

function motif(kind, id) {
  switch (kind) {
    case "rings":
      return [0, 1, 2, 3, 4].map((i) => `<circle cx="${700 + i * 40}" cy="300" r="${120 + i * 34}" fill="none" stroke="url(#gold-${id})" stroke-width="${1.6 - i * 0.25}" opacity="${0.9 - i * 0.15}"/>`).join("");
    case "drops":
      return [0, 1, 2].map((i) => `<path d="M${640 + i * 150} ${170 + i * 40} C ${600 + i * 150} ${260 + i * 40}, ${600 + i * 150} ${330 + i * 40}, ${640 + i * 150} ${340 + i * 40} C ${680 + i * 150} ${330 + i * 40}, ${680 + i * 150} ${260 + i * 40}, ${640 + i * 150} ${170 + i * 40} Z" fill="none" stroke="url(#gold-${id})" stroke-width="1.6"/>`).join("");
    case "sun":
      return `<circle cx="820" cy="300" r="120" fill="none" stroke="url(#gold-${id})" stroke-width="1.6"/>` +
        Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return `<line x1="${820 + Math.cos(a) * 150}" y1="${300 + Math.sin(a) * 150}" x2="${820 + Math.cos(a) * 200}" y2="${300 + Math.sin(a) * 200}" stroke="url(#gold-${id})" stroke-width="1.2" opacity="0.8"/>`;
        }).join("");
    case "moon":
      return `<path d="M860 160 A150 150 0 1 0 860 440 A120 120 0 1 1 860 160 Z" fill="none" stroke="url(#gold-${id})" stroke-width="1.8"/>` +
        [[640, 180], [700, 420], [980, 250], [1010, 460], [590, 330]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#e9d29b"/>`).join("");
  }
  return "";
}

for (const post of POSTS) {
  const id = `blog-${post.slug}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  ${defs(id, post.accent)}
  <rect width="1200" height="675" fill="url(#bg-${id})"/>
  <circle cx="820" cy="300" r="260" fill="${post.accent}" opacity="0.22" filter="url(#glow-${id})"/>
  ${motif(post.motif, id)}
  <line x1="80" y1="560" x2="460" y2="560" stroke="url(#gold-${id})" stroke-width="1"/>
  <text x="80" y="600" font-family="Georgia, serif" font-size="18" letter-spacing="8" fill="#d6b46c">THE ZEN AMOUR JOURNAL</text>
</svg>`;
  writeFileSync(join(OUT, "blog", `${post.slug}.svg`), svg);
}

// Hero texture: fine gold arcs
const heroId = "hero";
writeFileSync(
  join(OUT, "hero-texture.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
  ${defs(heroId, "#c49c4e")}
  ${Array.from({ length: 9 }, (_, i) => `<circle cx="800" cy="1150" r="${380 + i * 85}" fill="none" stroke="url(#gold-${heroId})" stroke-width="${i % 3 === 0 ? 1.1 : 0.5}" opacity="${0.5 - i * 0.04}"/>`).join("")}
  <line x1="0" y1="140" x2="1600" y2="140" stroke="url(#gold-${heroId})" stroke-width="0.4" opacity="0.25"/>
</svg>`,
);

console.log(`Generated ${PRODUCTS.length * 2} product images, ${POSTS.length} journal covers and the hero texture.`);
