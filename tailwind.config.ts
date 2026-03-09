import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Trust & Safety Pastel Theme
        primary: {
          DEFAULT: "#A5D8FF",
          foreground: "#1C4E6E",
          50: "#EFF9FF",
          100: "#D6EFFF",
          200: "#A5D8FF",
          300: "#74BFFF",
          400: "#3DA5FF",
          500: "#0B8CE0",
        },
        secondary: {
          DEFAULT: "#FFD8A8",
          foreground: "#7A4A10",
        },
        success: {
          DEFAULT: "#B2F2BB",
          foreground: "#1A5C24",
        },
        danger: {
          DEFAULT: "#FFC9C9",
          foreground: "#7A1C1C",
        },
        background: "#F8F9FA",
        surface: "#FFFFFF",
        border: "#DEE2E6",
        muted: {
          DEFAULT: "#F1F3F5",
          foreground: "#868E96",
        },
        text: {
          DEFAULT: "#495057",
          secondary: "#868E96",
          strong: "#212529",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "Pretendard", "system-ui", "sans-serif"],
        display: ["var(--font-pretendard)", "Pretendard", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.10), 0 0 1px rgba(0, 0, 0, 0.08)",
        field: "0 1px 3px rgba(165, 216, 255, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
