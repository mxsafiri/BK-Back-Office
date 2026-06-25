/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace TS packages from source.
  transpilePackages: ["@fimco/ui", "@fimco/api-client"],
  // Linting is handled by the repo-wide `npm run lint`; type errors still fail the build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
