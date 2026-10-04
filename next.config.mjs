/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Isolate verification builds from an already-running development server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Emit a self-contained server bundle for the Docker runtime stage.
  output: "standalone",
  // Linting is not part of the base project; keep builds focused on type-checking.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
