import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.node },
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
