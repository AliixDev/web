/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/web',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
