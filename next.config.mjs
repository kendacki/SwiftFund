/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce bundle: tree-shake large packages (framer-motion, etc.)
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default nextConfig;
