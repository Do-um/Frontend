import path from "path"
import { fileURLToPath } from "url"

/** @type {import('next').NextConfig} */
const remotePatterns = []
const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (process.env.NEXT_PUBLIC_API_BASE_URL) {
  try {
    const apiUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL)
    remotePatterns.push({
      protocol: apiUrl.protocol.replace(":", ""),
      hostname: apiUrl.hostname,
      port: apiUrl.port,
    })
  } catch {
    // Ignore invalid API base URLs and keep local/public images working.
  }
}

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    remotePatterns,
  },
}

export default nextConfig
