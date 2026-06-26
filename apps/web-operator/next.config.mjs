import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS packages from source.
  transpilePackages: ["@fimco/ui", "@fimco/api-client"],
  // Linting is handled by the repo-wide `npm run lint`; type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
  // Trace files from the monorepo root so root-hoisted deps (styled-jsx, etc.) are bundled.
  experimental: { outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)) },
};

export default nextConfig;
