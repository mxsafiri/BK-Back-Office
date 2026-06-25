/**
 * Shared Tailwind preset — FIMCO design tokens (see DESIGN_SYSTEM.md). Both apps extend this so
 * the brand stays consistent. Colors are static hex; fonts reference CSS variables set by
 * next/font (Quicksand for headings, Inter for body).
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#C76A57",
          hover: "#B2563F",
          pressed: "#9C4631",
          tint: "#F7DCD3",
          wash: "#FBEEE8",
        },
        canvas: { cream: "#F3E2D6", brand: "#C76A57" },
        surface: { DEFAULT: "#FFFFFF", subtle: "#F7F5F4", alt: "#FBF7F2" },
        ink: "#1F1B19",
        muted: "#6B6460",
        faint: "#A39B95",
        hairline: "#E7DDD5",
        success: { DEFAULT: "#2F9E5E", tint: "#D6F0DF" },
        warning: { DEFAULT: "#E08A1E", tint: "#FBE9CE" },
        danger: { DEFAULT: "#D14B45", tint: "#FBE0DE" },
        info: { DEFAULT: "#2D6FE0", tint: "#DCE7FB" },
        processing: { DEFAULT: "#7A5AF8", tint: "#E7E0FB" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-quicksand)", "var(--font-inter)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "24px", pill: "9999px" },
      boxShadow: {
        xs: "0 1px 2px rgba(31,27,25,0.04)",
        sm: "0 2px 8px rgba(31,27,25,0.06)",
        md: "0 4px 16px rgba(31,27,25,0.08)",
        lg: "0 8px 28px rgba(31,27,25,0.10)",
      },
      ringColor: { brand: "#C76A57" },
    },
  },
};
