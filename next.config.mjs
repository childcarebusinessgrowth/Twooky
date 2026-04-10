import path from "node:path"
import { fileURLToPath } from "node:url"
import bundleAnalyzer from "@next/bundle-analyzer"

/** @type {import('next').NextConfig} */
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
    /** Fewer legacy polyfills in app code; smaller imports from barrel packages (Lighthouse “Legacy JS” / unused JS). */
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
