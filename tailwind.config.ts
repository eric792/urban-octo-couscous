import type { Config } from "tailwindcss";

// Zen Amour palette: matte black surfaces with a rich, warm metallic gold.
const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0B",
          950: "#050506",
          900: "#0A0A0B",
          800: "#111113",
          700: "#17171A",
          600: "#1F1F23",
          500: "#2A2A30",
        },
        gold: {
          50: "#FBF7EE",
          100: "#F5ECD5",
          200: "#ECDDB3",
          300: "#E2CB8E",
          400: "#D6B46C",
          500: "#C49C4E",
          600: "#A7803A",
          700: "#82632C",
          800: "#5D4620",
          900: "#3B2C15",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.28em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
