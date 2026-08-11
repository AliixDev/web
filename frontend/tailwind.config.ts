import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        md: "1.75rem",
        lg: "2rem",
        "2xl": "2.5rem",
      },
      screens: {
        "2xl": "1360px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Grayscale-only ramp. Anchored on the brand neutrals:
        // #FFFFFF · #F7F7F7 · #F2F2F2 · #E5E5E5 · #A0A0A0 · #666666 · #222222 · #000000
        neutral: {
          50: "#FFFFFF",
          100: "#F7F7F7",
          150: "#F2F2F2",
          200: "#E5E5E5",
          300: "#CCCCCC",
          400: "#A0A0A0",
          500: "#808080",
          600: "#666666",
          700: "#4D4D4D",
          800: "#333333",
          900: "#222222",
          950: "#111111",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) + 1px)",
        sm: "var(--radius)",
      },
      boxShadow: {
        lift: "0 1px 2px rgba(0,0,0,0.04), 0 10px 32px -12px rgba(0,0,0,0.12)",
        panel: "0 0 0 1px rgba(0,0,0,0.07), 0 24px 80px -16px rgba(0,0,0,0.18)",
        "panel-sm": "0 0 0 1px rgba(0,0,0,0.05), 0 8px 32px -8px rgba(0,0,0,0.12)",
        elevated: "0 2px 4px rgba(0,0,0,0.02), 0 12px 48px -12px rgba(0,0,0,0.14)",
      },
      letterSpacing: {
        tighter: "-0.03em",
        wide2: "0.08em",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
        "premium-in": "cubic-bezier(0.4, 0, 1, 1)",
      },
      transitionDuration: {
        350: "350ms",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(28px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.4s ease-out both",
        "slide-in-right": "slide-in-right 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
        marquee: "marquee 36s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
