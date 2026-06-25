import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Tests run against package SOURCE (no build step): resolve @fimco/* to each package's src barrel.
const pkg = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@fimco/shared": pkg("./packages/shared/src/index.ts"),
      "@fimco/core": pkg("./packages/core/src/index.ts"),
      "@fimco/adapters": pkg("./packages/adapters/src/index.ts"),
      "@fimco/api-client": pkg("./packages/api-client/src/index.ts"),
    },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.ts"],
    environment: "node",
  },
});
