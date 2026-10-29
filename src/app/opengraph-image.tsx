import { ImageResponse } from "next/og";

export const alt = "Zen Amour — Quiet luxury meets everyday price";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at center, #2a2a30 0%, #0a0a0b 60%, #000 100%)",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 34, letterSpacing: 18, color: "#d6b46c" }}>ZEN AMOUR</div>
        <div style={{ marginTop: 40, fontSize: 72, fontWeight: 300 }}>Quiet Luxury Meets</div>
        <div style={{ fontSize: 72, fontStyle: "italic", color: "#e2cb8e" }}>Everyday Price</div>
        <div style={{ marginTop: 40, fontSize: 24, letterSpacing: 6, color: "#a1a1aa" }}>
          FRAGRANCE · SKINCARE · WELLNESS — SOUTH AFRICA
        </div>
      </div>
    ),
    size,
  );
}
