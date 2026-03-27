import path from "path"
import { fileURLToPath } from "url"

/** @type {import('next').NextConfig} */
const remotePatterns = []
const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    remotePatterns.push({
      protocol: supabaseUrl.protocol.replace(":", ""),
      hostname: supabaseUrl.hostname,
      port: supabaseUrl.port,
      pathname: "/**",
    })
  } catch {
    // Ignore invalid Supabase URLs and keep local/public images working.
  }
}

remotePatterns.push({
  protocol: "https",
  hostname: "lh3.googleusercontent.com",
  pathname: "/**",
})

const commonSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
]

const securityHeaders = [
  { key: "Content-Security-Policy", value: "base-uri 'self'; frame-ancestors 'none'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  ...commonSecurityHeaders,
]

const embeddableVendorHeaders = [
  { key: "Content-Security-Policy", value: "base-uri 'self'; frame-ancestors 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  ...commonSecurityHeaders,
]

const embeddableVendorIndexHeaders = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  ...embeddableVendorHeaders,
]

const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/vendor/roulette/index.html",
        headers: embeddableVendorIndexHeaders,
      },
      {
        source: "/vendor/roulette/:path*",
        headers: embeddableVendorHeaders,
      },
      {
        source: "/:path((?!vendor/roulette(?:/|$)).*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
