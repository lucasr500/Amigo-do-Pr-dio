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
