import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        navy: {
          50: "#EEF3FA",
          100: "#D9E3F2",
          200: "#B3C6E3",
          300: "#7F9CC9",
          400: "#4D72AD",
          500: "#2C548F",
          600: "#1E4176",
          700: "#16335F",
          800: "#10264A",
          900: "#0B1B36",
          950: "#071126",
        },
        brand: {
          50: "#FFF4EC",
          100: "#FFE4D1",
          200: "#FFC59F",
          300: "#FF9F63",
          400: "#F7802F",
          500: "#F26B1D",
          600: "#C94C0E",
          700: "#A63D0B",
          800: "#83310D",
          900: "#6B2A0F",
        },
        graphite: {
          50: "#F6F7F9",
          100: "#EDEFF3",
          200: "#DDE1E8",
          300: "#C3C9D3",
          400: "#98A1B0",
          500: "#626B7C",
          600: "#4F5868",
          700: "#3B4351",
          800: "#272D37",
          900: "#181C23",
        },
        whatsapp: { DEFAULT: "#25D366", dark: "#128C7E", deep: "#0E7A5F" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { "4xl": "2rem" },
      boxShadow: {
        soft: "0 1px 2px rgba(11,27,54,.04), 0 4px 16px -4px rgba(11,27,54,.08)",
        lift: "0 2px 4px rgba(11,27,54,.04), 0 18px 40px -12px rgba(11,27,54,.22)",
        glow: "0 10px 30px -10px rgba(242,107,29,.55)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "pulse-ring": {
          "0%": { transform: "scale(.9)", opacity: ".7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up .5s ease-out both",
        shimmer: "shimmer 1.6s infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(.2,.6,.4,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
