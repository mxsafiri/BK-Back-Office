/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fimco/ui", "@fimco/api-client"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
