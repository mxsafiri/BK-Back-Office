/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fimco/ui"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
