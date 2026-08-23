import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B1420",
        surface: "#121B29",
        "surface-raised": "#182338",
        border: "#223047",
        signal: "#4CD6E0",
        positive: "#5CD98A",
        negative: "#FF6B5E",
        warning: "#F2A93B",
        "text-primary": "#E7ECF3",
        "text-muted": "#8493A8",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "radar-spin": { to: { transform: "rotate(360deg)" } },
        "blip-in": {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "0.85", transform: "scale(1)" },
        },
        "log-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "radar-spin": "radar-spin 2.4s linear infinite",
        "blip-in": "blip-in 0.5s ease-out forwards",
        "log-in": "log-in 0.35s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
