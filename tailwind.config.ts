import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal do Amigo do Prédio
        navy: {
          50: "#f0f4f9",
          100: "#dbe5ef",
          200: "#b9cde0",
          300: "#8badc9",
          400: "#5c87ad",
          500: "#406b94",
          600: "#32547a",
          700: "#2a4463",
          800: "#1f3147", // azul escuro principal
          900: "#16243a",
          950: "#0d1726",
        },
        sage: {
          50: "#f3f8f4",
          100: "#e3efe5",
          200: "#c8dfcc",
          300: "#9ec7a6",
          400: "#6fa97c",
          500: "#4f8d5e", // verde suave principal
          600: "#3d7249",
          700: "#325b3c",
          800: "#2a4832",
          900: "#243b2b",
        },
        cream: {
          50: "#fdfcf9",
          100: "#f9f6ef",
          200: "#f1ebde",
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
