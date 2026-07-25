/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:41001/:path*",
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.replit.dev",
    "*.worf.replit.dev",
    "*.picard.replit.dev",
    "*.repl.co",
  ],
}

export default nextConfig
