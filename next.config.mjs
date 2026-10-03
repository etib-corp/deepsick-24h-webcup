import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for the Docker runtime stage.
  output: "standalone",
  // Linting is not part of the base project; keep builds focused on type-checking.
  eslint: { ignoreDuringBuilds: true },
};

// `ANALYZE=true next build` to inspect client bundles per route.
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
