import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal do Amigo do Prédio — Fase 45
        navy: {
          50:  "#edf4f8",
          100: "#d1e5ef",
          200: "#a3ccdf",
          300: "#72aecc",
          400: "#468fb5",
          500: "#307398",
          600: "#275d7c",
          700: "#234B63", // navy principal #234B63
          800: "#1b3a4f",
          900: "#132b3b",
          950: "#0c1d27",
        },
        terracotta: {
          50:  "#fdf3ee",
          100: "#fae4d5",
          200: "#f5c9ab",
          300: "#edaa7e",
          400: "#e38b5b",
          500: "#C97852", // terracotta accent #C97852
          600: "#a6613f",
          700: "#844c30",
          800: "#633823",
          900: "#492618",
        },
        cream: {
          50:  "#FAF7F2",
          100: "#F7F1E8", // brand cream #F7F1E8
          200: "#EDE5D4",
        },
        green: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        amber: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
      },
      boxShadow: {
        card:       "0 1px 3px rgba(35,75,99,0.06), 0 1px 2px rgba(35,75,99,0.04)",
        "card-md":  "0 2px 8px rgba(35,75,99,0.08), 0 1px 3px rgba(35,75,99,0.05)",
        "card-hover":"0 4px 16px rgba(35,75,99,0.10), 0 1px 4px rgba(35,75,99,0.06)",
        nav:        "0 -1px 0 rgba(35,75,99,0.06)",
        elevated:   "0 8px 32px rgba(35,75,99,0.12), 0 2px 8px rgba(35,75,99,0.06)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "slide-up-toast": "slideUpToast 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "blink": "blink 1.2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUpToast: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        blink: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
