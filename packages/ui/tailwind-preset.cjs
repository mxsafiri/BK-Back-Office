/**
 * Shared Tailwind preset — FIMCO design tokens (see DESIGN_SYSTEM.md).
 *
 * Brand palette: NAVY + FIMCO RED (from the FIMCO logo).
 *  - `brand` (navy) is the primary/chrome colour: sidebar, primary buttons, active nav, links.
 *  - `accent` (red) is the brand accent; the SAME red is the semantic `danger` / negative-money
 *    colour, so red consistently means "attention / loss / destructive" (it never doubles as a
 *    primary action — that's navy).
 * Fonts reference CSS variables set by next/font (Quicksand headings, Inter body).
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1F3A5C", // navy
          hover: "#193150",
          pressed: "#132742",
          tint: "#DCE4EF",
          wash: "#EEF2F8",
        },
        accent: {
          DEFAULT: "#D8302B", // FIMCO red
          hover: "#BE2A26",
          tint: "#FBE3E2",
        },
        canvas: { base: "#F4F5F7", brand: "#1F3A5C" },
        surface: { DEFAULT: "#FFFFFF", subtle: "#F1F3F6", alt: "#F8FAFC" },
        ink: "#14202E",
        muted: "#5A6776",
        faint: "#93A0AE",
        hairline: "#E2E7EE",
        success: { DEFAULT: "#2F9E5E", tint: "#D6F0DF" },
        warning: { DEFAULT: "#E08A1E", tint: "#FBE9CE" },
        danger: { DEFAULT: "#D8302B", tint: "#FBE3E2" }, // == FIMCO red
        info: { DEFAULT: "#2D6FE0", tint: "#DCE7FB" },
        processing: { DEFAULT: "#6E59E0", tint: "#E6E1FB" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-quicksand)", "var(--font-inter)", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { sm: "6px", md: "10px", lg: "14px", xl: "20px", "2xl": "24px", pill: "9999px" },
      boxShadow: {
        xs: "0 1px 2px rgba(20,32,46,0.04)",
        sm: "0 2px 8px rgba(20,32,46,0.06)",
        md: "0 4px 16px rgba(20,32,46,0.08)",
        lg: "0 8px 28px rgba(20,32,46,0.10)",
      },
      ringColor: { brand: "#1F3A5C" },
    },
  },
};
