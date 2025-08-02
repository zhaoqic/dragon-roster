/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/dragon-roster',
  assetPrefix: '/dragon-roster/',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig