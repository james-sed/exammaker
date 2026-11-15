const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    /**
     * Locked type scale. Sizes outside 12/14/16/18/20/24/30/36/48/60 are
     * intentionally unavailable; arbitrary values (`text-[13px]`) are banned.
     */
    fontSize: {
      xs: ["0.75rem", { lineHeight: "1.5" }],
      sm: ["0.875rem", { lineHeight: "1.5" }],
      base: ["1rem", { lineHeight: "1.6" }],
      lg: ["1.125rem", { lineHeight: "1.55" }],
      xl: ["1.25rem", { lineHeight: "1.4" }],
      "2xl": ["1.5rem", { lineHeight: "1.33" }],
      "3xl": ["1.875rem", { lineHeight: "1.27" }],
      "4xl": ["2.25rem", { lineHeight: "1.2" }],
      "5xl": ["3rem", { lineHeight: "1.15" }],
      "6xl": ["3.75rem", { lineHeight: "1.1" }],
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          hover: "hsl(var(--primary-hover))",
          active: "hsl(var(--primary-active))",
          foreground: "hsl(var(--primary-foreground))",
          text: "hsl(var(--primary-text))",
          tint: "hsl(var(--primary-tint))",
          "tint-foreground": "hsl(var(--primary-tint-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          hover: "hsl(var(--secondary-hover))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        subtle: {
          foreground: "hsl(var(--subtle-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          fill: "hsl(var(--success-fill))",
          foreground: "hsl(var(--success-foreground))",
          tint: "hsl(var(--success-tint))",
          "tint-foreground": "hsl(var(--success-tint-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          accent: "hsl(var(--warning-accent))",
          foreground: "hsl(var(--warning-foreground))",
          tint: "hsl(var(--warning-tint))",
          "tint-foreground": "hsl(var(--warning-tint-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          hover: "hsl(var(--destructive-hover))",
          active: "hsl(var(--destructive-active))",
          text: "hsl(var(--destructive-text))",
          fill: "hsl(var(--destructive-fill))",
          foreground: "hsl(var(--destructive-foreground))",
          tint: "hsl(var(--destructive-tint))",
          "tint-foreground": "hsl(var(--destructive-tint-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        // shadcn compatibility: legacy `bg-accent` maps to the neutral surface.
        accent: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "16px",
      },
      boxShadow: {
        DEFAULT: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        sm: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        md: "0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
        lg: "0 12px 32px -8px rgb(15 23 42 / 0.1), 0 4px 8px -4px rgb(15 23 42 / 0.05)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        display: ["var(--font-display)", ...fontFamily.sans],
      },
      maxWidth: {
        content: "1152px",
      },
      lineHeight: {
        heading: "1.2",
        display: "1.1",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0, 0, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
