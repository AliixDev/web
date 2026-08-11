/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/web',
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
