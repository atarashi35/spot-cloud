/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  typedRoutes: true,
  images: {
    remotePatterns: [
      // Firebase Storage（新バケット形式）
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com"
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com"
      }
    ]
  }
};

export default nextConfig;
