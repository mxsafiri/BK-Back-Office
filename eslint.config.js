import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "**/.next/**", "**/next-env.d.ts"] },
  js.configs.recommended,
  // CommonJS config files (tailwind/postcss presets, *.cjs).
  {
    files: ["**/*.cjs", "**/tailwind.config.js", "**/postcss.config.js"],
    languageOptions: { sourceType: "commonjs", globals: { ...globals.node } },
  },
  // TypeScript / React source across backend packages and frontend apps.
  {
    files: ["packages/**/*.ts", "packages/**/*.tsx", "apps/**/*.ts", "apps/**/*.tsx"],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
      // TypeScript itself catches undefined identifiers; core no-undef false-positives on
      // type-only ambient globals (RequestInit, NodeJS, etc.). Disable per typescript-eslint guidance.
      "no-undef": "off",
      // Money safety: floats are banned in money math — keep an eye on Number usage in money paths.
      "no-restricted-globals": ["error", { name: "parseFloat", message: "No floats in money math — use integer minor units (bigint)." }],
    },
  },
];
