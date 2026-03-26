"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu, X } from "lucide-react"

import { useAdminSession } from "@/hooks/use-admin-session"
import { signOut } from "@/lib/auth"

const introLinks = [
  { href: "/", label: "소개" },
  { href: "/team", label: "운영진" },
]

const activityLinks = [
  { href: "/activities", label: "주요활동" },
  { href: "/activities/projects", label: "프로젝트" },
  { href: "/activities/study", label: "스터디" },
]

const mainLinks = [
  { href: "/recruit", label: "모집" },
  { href: "/rental", label: "대여" },
]

export function HeaderNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [openMenu, setOpenMenu] = useState<"intro" | "activities" | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileOpenMenu, setMobileOpenMenu] = useState<"intro" | "activities" | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const { isAdmin, isLoggedIn, loading: sessionLoading } = useAdminSession()

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handleMenuOpen = (menu: "intro" | "activities") => {
    clearCloseTimer()
    setOpenMenu(menu)
  }

  const handleMenuClose = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setOpenMenu(null)
      closeTimerRef.current = null
    }, 120)
  }

  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  useEffect(() => {
    setOpenMenu(null)
    setMobileMenuOpen(false)
    setMobileOpenMenu(null)
  }, [pathname])

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      setOpenMenu(null)
      setMobileMenuOpen(false)
      setMobileOpenMenu(null)
      router.push("/")
      router.refresh()
    }
  }

  const desktopLinkClass =
    "inline-flex h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold leading-none text-[#18232d] transition-colors hover:text-[#47708a]"

  const mobileLinkClass =
    "flex min-h-11 items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-[#18232d] transition-colors hover:bg-[#f3f8fc]"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/8 bg-white/72 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
        <Link href="/" className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-80 sm:h-12 sm:w-12">
          <Image src="/logo.png" alt="Do,um 로고" width={45} height={45} priority />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <div
            className="relative flex h-11 items-center after:absolute after:left-0 after:top-full after:h-3 after:w-full after:content-['']"
            onMouseEnter={() => handleMenuOpen("intro")}
            onMouseLeave={handleMenuClose}
          >
            <button
              type="button"
              aria-expanded={openMenu === "intro"}
              onClick={() => setOpenMenu((current) => (current === "intro" ? null : "intro"))}
              className={desktopLinkClass}
            >
              소개
              <ChevronDown className={`size-4 transition-transform ${openMenu === "intro" ? "rotate-180" : ""}`} />
            </button>

            {openMenu === "intro" ? (
              <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
                <div className="min-w-[11rem] rounded-2xl border border-[#dbe7ef] bg-white/96 p-2 shadow-[0_18px_40px_rgba(36,64,84,0.16)]">
                  {introLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMenu(null)}
                      className="flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium text-[#223541] transition-colors hover:bg-[#f4f9fc]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div
            className="relative flex h-11 items-center after:absolute after:left-0 after:top-full after:h-3 after:w-full after:content-['']"
            onMouseEnter={() => handleMenuOpen("activities")}
            onMouseLeave={handleMenuClose}
          >
            <button
              type="button"
              aria-expanded={openMenu === "activities"}
              onClick={() => setOpenMenu((current) => (current === "activities" ? null : "activities"))}
              className={desktopLinkClass}
            >
              활동
              <ChevronDown className={`size-4 transition-transform ${openMenu === "activities" ? "rotate-180" : ""}`} />
            </button>

            {openMenu === "activities" ? (
              <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
                <div className="min-w-[11rem] rounded-2xl border border-[#dbe7ef] bg-white/96 p-2 shadow-[0_18px_40px_rgba(36,64,84,0.16)]">
                  {activityLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenMenu(null)}
                      className="flex min-h-10 items-center rounded-xl px-3 py-2 text-sm font-medium text-[#223541] transition-colors hover:bg-[#f4f9fc]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {mainLinks.map((item) => (
            <Link key={item.href} href={item.href} className={desktopLinkClass}>
              {item.label}
            </Link>
          ))}

          {sessionLoading ? (
            <span aria-hidden="true" className="inline-flex h-11 min-w-[84px] items-center justify-center rounded-full px-3 opacity-0">
              권한 관리
            </span>
          ) : isAdmin ? (
            <Link href="/admin/users" className={desktopLinkClass}>
              권한 관리
            </Link>
          ) : null}

          {sessionLoading ? (
            <span aria-hidden="true" className="inline-flex h-11 min-w-[72px] items-center justify-center rounded-full px-3 opacity-0">
              로그인
            </span>
          ) : isLoggedIn ? (
            <button type="button" onClick={handleLogout} className={desktopLinkClass}>
              로그아웃
            </button>
          ) : (
            <Link href="/login" className={desktopLinkClass}>
              로그인
            </Link>
          )}
        </nav>

        <button
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setMobileMenuOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dbe7ef] bg-white/90 text-[#18232d] shadow-sm transition hover:bg-white lg:hidden"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="mx-auto mt-3 max-w-[1400px] lg:hidden">
          <div className="max-h-[calc(100svh-5.75rem)] overflow-y-auto rounded-[28px] border border-[#dbe7ef] bg-white/96 p-4 shadow-[0_24px_60px_rgba(33,61,82,0.16)]">
            <div className="space-y-2">
              <div className="rounded-[22px] bg-[#f8fbfd] p-2">
                <button
                  type="button"
                  onClick={() => setMobileOpenMenu((current) => (current === "intro" ? null : "intro"))}
                  className="flex min-h-11 w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#18232d]"
                >
                  <span>소개</span>
                  <ChevronDown
                    className={`size-4 transition-transform ${mobileOpenMenu === "intro" ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileOpenMenu === "intro" ? (
                  <div className="space-y-1 px-1 pb-1">
                    {introLinks.map((item) => (
                      <Link key={item.href} href={item.href} className={mobileLinkClass}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[22px] bg-[#f8fbfd] p-2">
                <button
                  type="button"
                  onClick={() => setMobileOpenMenu((current) => (current === "activities" ? null : "activities"))}
                  className="flex min-h-11 w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#18232d]"
                >
                  <span>활동</span>
                  <ChevronDown
                    className={`size-4 transition-transform ${mobileOpenMenu === "activities" ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileOpenMenu === "activities" ? (
                  <div className="space-y-1 px-1 pb-1">
                    {activityLinks.map((item) => (
                      <Link key={item.href} href={item.href} className={mobileLinkClass}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {mainLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={`${mobileLinkClass} border border-[#e5edf3] bg-white`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-[#e5edf3] pt-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {sessionLoading ? (
                  <div className="h-11 rounded-2xl bg-[#f4f7f9]" />
                ) : isAdmin ? (
                  <Link
                    href="/admin/users"
                    className="flex min-h-11 items-center justify-center rounded-2xl border border-[#dbe7ef] bg-white px-4 py-3 text-sm font-semibold text-[#223541]"
                  >
                    권한 관리
                  </Link>
                ) : null}

                {sessionLoading ? (
                  <div className="h-11 rounded-2xl bg-[#f4f7f9]" />
                ) : isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 items-center justify-center rounded-2xl bg-[#1f2730] px-4 py-3 text-sm font-semibold text-white"
                  >
                    로그아웃
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex min-h-11 items-center justify-center rounded-2xl bg-[#1f2730] px-4 py-3 text-sm font-semibold text-white"
                  >
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
