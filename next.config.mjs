import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Isolate verification builds from an already-running development server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Emit a self-contained server bundle for the Docker runtime stage.
  output: "standalone",
  // Linting is not part of the base project; keep builds focused on type-checking.
  eslint: { ignoreDuringBuilds: true },
  // Baseline hardening, applied to every response by the platform itself.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

// `ANALYZE=true next build` to inspect client bundles per route.
export default withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" })(nextConfig);
