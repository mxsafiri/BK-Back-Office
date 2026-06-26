import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fimco/ui", "@fimco/api-client"],
  eslint: { ignoreDuringBuilds: true },
  experimental: { outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)) },
};

export default nextConfig;
