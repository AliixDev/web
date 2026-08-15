/** @type {import('next').NextConfig} */
// The site is served from the root of the custom domain
// (https://www.sdbbuy.com/), so no basePath is set. A subpath basePath
// (e.g. '/web' for the GitHub Pages project URL) prefixes every asset
// URL with /web/ and 404s on the custom domain, leaving the page
// unstyled. Keep basePath empty for the custom-domain deployment.
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Keep static-generation workers bounded so builds stay within
  // memory-constrained environments (e.g. 2 GB container limits).
  experimental: {
    cpus: 2,
  },
};

module.exports = nextConfig;
