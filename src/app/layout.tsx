import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"

const DEFAULT_SITE_URL = "https://doum-page.vercel.app"
const SITE_DESCRIPTION = "Official Do,um website"

function resolveMetadataBase() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    DEFAULT_SITE_URL,
  ]

  for (const candidate of candidates) {
    if (!candidate) {
      continue
    }

    const trimmed = candidate.trim()
    if (!trimmed) {
      continue
    }

    const normalized = trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`

    try {
      return new URL(normalized)
    } catch {
      continue
    }
  }

  return new URL(DEFAULT_SITE_URL)
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "Do,um",
    template: "%s | Do,um",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Do,um",
  openGraph: {
    title: "Do,um",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "Do,um",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/hero-banner.svg",
        width: 1280,
        height: 366,
        alt: "Do,um website preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Do,um",
    description: SITE_DESCRIPTION,
    images: ["/hero-banner.svg"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
