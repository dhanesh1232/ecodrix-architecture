/**
 * ECODrIx Tailwind Config v1.0
 * Generated from ecodrix-tokens.json
 * Paste into tailwind.config.js at project root.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  // Theme toggle via data attribute (not class)
  darkMode: ["selector", '[data-theme="dark"]'],

  theme: {
    extend: {
      /* ── Brand Colors ─────────────────────────────────── */
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#2563EB", // LOGO — E/X letters
          600: "#1D4ED8",
          700: "#1E40AF",
          800: "#1E3A8A",
          900: "#172554",
          DEFAULT: "#2563EB",
        },
        accent: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#7C3AED", // LOGO — arc/swish
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3B0764",
          DEFAULT: "#7C3AED",
        },
        fire: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#DC2626", // LOGO — i dot
          600: "#B91C1C",
          700: "#991B1B",
          800: "#7F1D1D",
          900: "#450A0A",
          DEFAULT: "#DC2626",
        },

        // Product assignments
        "product-crm": "#2563EB",
        "product-laie": "#7C3AED",
        "product-connect": "#DC2626",
        "product-store": "#475569",
        "product-storage": "#2563EB",

        // Surface — light
        "canvas-light": "#FFFFFF",
        "soft-light": "#F8FAFF",
        "card-light": "#FFFFFF",
        "elevated-light": "#F1F5FF",

        // Surface — dark
        "canvas-dark": "#0B1120",
        "soft-dark": "#111827",
        "card-dark": "#111E33",
        "elevated-dark": "#162040",

        // Semantic
        success: "#16A34A",
        warning: "#D97706",
        error: "#EF4444",
        info: "#0EA5E9",
      },

      /* ── Typography ──────────────────────────────────── */
      fontFamily: {
        display: ["Syne", "system-ui", "-apple-system", "sans-serif"],
        body: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        code: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        "display-xl": [
          "72px",
          { lineHeight: "1.0", letterSpacing: "-0.025em", fontWeight: "800" },
        ],
        "display-lg": [
          "52px",
          { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "display-md": [
          "40px",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "display-sm": [
          "32px",
          { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "700" },
        ],
        "title-lg": [
          "24px",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        "title-md": [
          "20px",
          { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" },
        ],
        "title-sm": [
          "18px",
          { lineHeight: "1.4", letterSpacing: "0", fontWeight: "600" },
        ],
        label: [
          "13px",
          { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "700" },
        ],
        "body-lg": [
          "18px",
          { lineHeight: "1.75", letterSpacing: "0", fontWeight: "400" },
        ],
        "body-md": [
          "16px",
          { lineHeight: "1.65", letterSpacing: "0", fontWeight: "400" },
        ],
        "body-sm": [
          "14px",
          { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" },
        ],
        caption: [
          "12px",
          { lineHeight: "1.4", letterSpacing: "0.02em", fontWeight: "500" },
        ],
        btn: [
          "14px",
          { lineHeight: "1.0", letterSpacing: "0.02em", fontWeight: "600" },
        ],
        nav: [
          "14px",
          { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "500" },
        ],
        code: [
          "13px",
          { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" },
        ],
      },

      /* ── Spacing ─────────────────────────────────────── */
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        lg: "24px", // card padding, grid gutters
        xl: "40px", // modal, pricing card padding
        xxl: "64px", // hero band
        section: "96px", // between major bands
      },

      /* ── Border Radius ───────────────────────────────── */
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "6px",
        md: "10px", // DEFAULT INTERACTIVE — buttons, inputs
        lg: "12px", // DEFAULT CARD
        xl: "16px", // mockup, modals
        "2xl": "24px",
        full: "9999px",
        DEFAULT: "10px", // fallback = interactive default
      },

      /* ── Box Shadow ──────────────────────────────────── */
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "hover-light": "0 20px 40px rgba(37,99,235,0.12)",
        "hover-dark": "0 20px 40px rgba(0,0,0,0.4)",
        featured:
          "0 0 0 4px rgba(37,99,235,0.08), 0 20px 40px rgba(37,99,235,0.1)",
        "mockup-light":
          "0 24px 60px rgba(37,99,235,0.1), 0 4px 12px rgba(0,0,0,0.05)",
        "mockup-dark":
          "0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(37,99,235,0.15)",
        "btn-blue": "0 6px 20px rgba(37,99,235,0.35)",
        "btn-purple": "0 6px 20px rgba(124,58,237,0.35)",
        "btn-fire": "0 8px 28px rgba(124,58,237,0.4)",
      },

      /* ── Max Width ───────────────────────────────────── */
      maxWidth: {
        container: "1100px",
        cta: "640px",
        prose: "68ch",
      },

      /* ── Height ──────────────────────────────────────── */
      height: {
        nav: "68px",
        "btn-sm": "36px",
        "btn-md": "40px",
        "btn-lg": "48px",
        "btn-xl": "52px",
        input: "44px",
        touch: "44px", // WCAG minimum touch target
      },

      /* ── Transition ──────────────────────────────────── */
      transitionDuration: {
        instant: "80ms",
        fast: "150ms",
        base: "200ms",
        moderate: "300ms",
        slow: "500ms",
      },

      transitionTimingFunction: {
        standard: "cubic-bezier(0.4, 0, 0.2, 1)",
        decelerate: "cubic-bezier(0, 0, 0.2, 1)",
        accelerate: "cubic-bezier(0.4, 0, 1, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      /* ── Animation ───────────────────────────────────── */
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "fade-up": "fade-up 500ms cubic-bezier(0,0,0.2,1) both",
        "scale-in": "scale-in 300ms cubic-bezier(0,0,0.2,1) both",
        "spin-slow": "spin 0.7s linear infinite",
        skeleton: "skeleton-shimmer 1.5s ease-in-out infinite",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.3", transform: "scale(0.6)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "skeleton-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },

      /* ── Background Image (gradients) ───────────────── */
      backgroundImage: {
        "gradient-cosmic": "linear-gradient(135deg, #2563EB, #7C3AED)",
        "gradient-phoenix": "linear-gradient(135deg, #7C3AED, #DC2626)",
        "gradient-brand":
          "linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #DC2626 100%)",
        "gradient-brand-dark":
          "linear-gradient(135deg, #1D4ED8 0%, #6D28D9 50%, #B91C1C 100%)",
        "gradient-hero-glow":
          "radial-gradient(ellipse 60% 50% at 80% 40%, rgba(37,99,235,0.07) 0%, transparent 70%)",
        "gradient-hero-glow-dark":
          "radial-gradient(ellipse 60% 50% at 80% 40%, rgba(37,99,235,0.1) 0%, transparent 70%)",
        "gradient-stat-divider":
          "linear-gradient(to bottom, transparent, #E2E8F0, transparent)",
        "gradient-stat-divider-dark":
          "linear-gradient(to bottom, transparent, #1E2D4A, transparent)",
      },

      /* ── Grid ────────────────────────────────────────── */
      gridTemplateColumns: {
        "auto-fill-card": "repeat(auto-fill, minmax(320px, 1fr))",
        hero: "1.1fr 0.9fr",
        pricing: "repeat(3, 1fr)",
        products: "repeat(3, 1fr)",
        stats: "1fr auto 1fr auto 1fr auto 1fr",
        footer: "1fr 1fr 1fr",
      },
    },
  },

  plugins: [
    // Gradient text utility
    function ({ addUtilities }) {
      addUtilities({
        ".text-gradient-cosmic": {
          background: "linear-gradient(135deg, #2563EB, #7C3AED)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".text-gradient-phoenix": {
          background: "linear-gradient(135deg, #7C3AED, #DC2626)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".text-gradient-brand": {
          background:
            "linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #DC2626 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".border-stripe-brand": {
          "border-top": "3px solid",
          "border-image": "linear-gradient(90deg, #2563EB, #7C3AED, #DC2626) 1",
        },
        ".bg-card-light": {
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          "border-radius": "12px",
        },
        ".bg-card-dark": {
          background: "#111E33",
          border: "1px solid #1E2D4A",
          "border-radius": "12px",
        },
      });
    },
  ],
};

/*
 * ── Quick Reference Class Map ────────────────────────────
 *
 * Buttons:
 *   bg-primary-500 hover:bg-primary-600 text-white rounded-md font-semibold
 *   bg-accent-500  hover:bg-accent-600  text-white rounded-md
 *   bg-gradient-brand text-white rounded-md
 *   border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white rounded-md
 *
 * Cards:
 *   bg-card-light dark:bg-card-dark border border-[#E2E8F0] dark:border-[#1E2D4A] rounded-lg p-lg
 *
 * Typography:
 *   font-display text-display-xl     → Syne 800 hero
 *   font-display text-title-lg       → Syne 700 card title
 *   font-body text-body-md           → Inter 400 body
 *   font-body text-label uppercase   → Inter 700 0.08em eyebrow
 *   text-gradient-brand font-display → gradient headline
 *
 * Badges:
 *   bg-primary-100 text-primary-700 text-label uppercase rounded-full px-3 py-1
 *   dark:bg-primary-500/12 dark:text-primary-400
 *
 * ────────────────────────────────────────────────────────
 */
