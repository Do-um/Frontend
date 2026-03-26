import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const DEFAULT_SITE_URL = "https://doum-page.vercel.app"

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
  description: "국민대학교 소프트웨어 교육봉사 동아리 Do,um 공식 웹사이트",
  applicationName: "Do,um",
  openGraph: {
    title: "Do,um",
    description: "국민대학교 소프트웨어 교육봉사 동아리 Do,um 공식 웹사이트",
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
    description: "국민대학교 소프트웨어 교육봉사 동아리 Do,um 공식 웹사이트",
    images: ["/hero-banner.svg"],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
