/** @type {import('next').NextConfig} */

// GitHub Pages serves a project site from https://<user>.github.io/<repo>/,
// so every asset/link needs a basePath of "/<repo>" unless you're using a
// custom domain (in which case leave NEXT_PUBLIC_BASE_PATH unset/empty).
// The deploy workflow sets this automatically from the repository name.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  // GitHub Pages has no dynamic route resolver, so every route needs a
  // trailing slash + index.html (e.g. /cart/index.html) to be reachable.
  trailingSlash: true,
  images: {
    // next/image's default loader needs a Node server to optimize
    // images on request; GitHub Pages only serves static files, so
    // optimization must be disabled and images served as-is.
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
