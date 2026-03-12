"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import { useAdminSession } from "@/hooks/use-admin-session"
import { clearStoredTokens } from "@/lib/auth"

// ========== 헤더 네비게이션 컴포넌트 ==========
// 모든 페이지에서 공통으로 사용하는 헤더 컴포넌트
// 소개 버튼에 드롭다운 메뉴 포함

export function HeaderNav() {
  const router = useRouter()
  const [openMenu, setOpenMenu] = useState<"intro" | "activities" | null>(null)
  const closeTimerRef = useRef<number | null>(null)
  const { isLoggedIn } = useAdminSession()

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

  const handleLogout = () => {
    clearStoredTokens()
    setOpenMenu(null)
    router.push("/")
    router.refresh()
  }

  return (
    // 전체 페이지 상단에 고정해서 재사용하는 헤더 영역
    <header className="relative z-40 w-full border-b border-black/8 bg-[#f7faf7]/94 px-6 py-3 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex h-11 w-11 items-center justify-center transition-opacity hover:opacity-80 sm:h-12 sm:w-12">
          <Image src="/logo.png" alt="Do,um 로고" width={45} height={45} priority />
        </Link>

        {/* 상단 네비게이션 메뉴 목록 */}
        <nav className="flex items-center gap-4 sm:gap-6">
          {/* 마우스 오버 시 '소개' 하위 메뉴를 표시 */}
          <div
            className="relative flex h-11 items-center after:absolute after:left-0 after:top-full after:h-3 after:w-full after:content-['']"
            onMouseEnter={() => handleMenuOpen("intro")}
            onMouseLeave={handleMenuClose}
          >
            <button
              type="button"
              aria-expanded={openMenu === "intro"}
              className="inline-flex h-11 items-center px-3 text-sm font-semibold leading-none text-[#18232d] transition-colors hover:text-[#47708a]"
            >
              소개
            </button>

            {/* 소개 드롭다운 */}
            {openMenu === "intro" && (
              <div className="absolute left-1/2 top-full z-50 w-auto -translate-x-1/2 pt-2">
                <div className="rounded-md border bg-white py-1 shadow-md">
                <Link
                  href="/"
                  className="block whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  동아리
                </Link>
                <Link
                  href="/team"
                  className="block whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  운영진
                </Link>
                </div>
              </div>
            )}
          </div>

          {/* 마우스 오버 시 '활동' 하위 메뉴를 표시 */}
          <div
            className="relative flex h-11 items-center after:absolute after:left-0 after:top-full after:h-3 after:w-full after:content-['']"
            onMouseEnter={() => handleMenuOpen("activities")}
            onMouseLeave={handleMenuClose}
          >
            <button
              type="button"
              aria-expanded={openMenu === "activities"}
              className="inline-flex h-11 items-center px-3 text-sm font-semibold leading-none text-[#18232d] transition-colors hover:text-[#47708a]"
            >
              활동
            </button>

            {/* 활동 드롭다운 */}
            {openMenu === "activities" && (
              <div className="absolute left-1/2 top-full z-50 w-auto -translate-x-1/2 pt-2">
                <div className="rounded-md border bg-white py-1 shadow-md">
                <Link
                  href="/activities"
                  className="block whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  주요활동
                </Link>
                <Link
                  href="/activities/projects"
                  className="block whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  프로젝트
                </Link>
                <Link
                  href="/activities/study"
                  className="block whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  스터디
                </Link>
                <Link
                  href="/activities/mogakko"
                  className="block whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                >
                  모각코
                </Link>
                </div>
              </div>
            )}
          </div>
          <Link
            href="/recruit"
            className="inline-flex h-11 items-center px-3 text-sm font-semibold leading-none text-[#18232d] transition-colors hover:text-[#47708a]"
          >
            모집
          </Link>
          <Link
            href="/rental"
            className="inline-flex h-11 items-center px-3 text-sm font-semibold leading-none text-[#18232d] transition-colors hover:text-[#47708a]"
          >
            대여
          </Link>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-11 items-center px-3 text-sm font-semibold leading-none text-[#18232d] transition-colors hover:text-[#47708a]"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-11 items-center px-3 text-sm font-semibold leading-none text-[#18232d] transition-colors hover:text-[#47708a]"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
