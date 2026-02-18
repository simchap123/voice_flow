import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "vf-bg": "#06080f",
        "vf-card": "#0c1020",
        "vf-card-hover": "#111630",
        "vf-text": "#e8eaf0",
        "vf-muted": "#7a7f96",
        "vf-primary": "#7c3aed",
        "vf-primary-light": "#a78bfa",
        "vf-primary-glow": "rgba(124, 58, 237, 0.3)",
        "vf-accent": "#3b82f6",
        "vf-border": "rgba(255,255,255,0.06)",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
