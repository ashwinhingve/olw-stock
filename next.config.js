/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Reduce build output size to avoid memory issues
  output: 'standalone',
  // Skip type checking for faster builds
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: false,
}

module.exports = nextConfig 