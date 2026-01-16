"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// ========== 헤더 네비게이션 컴포넌트 ==========
// 모든 페이지에서 공통으로 사용하는 헤더 컴포넌트
// 소개 버튼에 드롭다운 메뉴 포함

export function HeaderNav() {
  // 드롭다운 열림/닫힘 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <header className="w-full border-b bg-white px-8 py-4">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="Do,um 로고" width={45} height={45} priority />
        </Link>

        {/* 네비게이션 메뉴 - gap-8을 gap-6으로 줄임 */}
        <nav className="flex items-center gap-6">
          <div
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="text-sm font-medium transition-colors hover:text-primary px-4 py-3">소개</button>

            {isDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-auto rounded-md border bg-white shadow-md py-1 z-50">
                <Link
                  href="/"
                  className="block px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 whitespace-nowrap"
                >
                  동아리
                </Link>
                <Link
                  href="/team"
                  className="block px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 whitespace-nowrap"
                >
                  운영진
                </Link>
              </div>
            )}
          </div>

          <Link href="/#activities" className="text-sm font-medium transition-colors hover:text-primary px-2 py-3">
            활동
          </Link>
          <Link href="/recruit" className="text-sm font-medium transition-colors hover:text-primary px-2 py-3">
            모집
          </Link>
          <Link href="#" className="text-sm font-medium transition-colors hover:text-primary px-2 py-3">
            대여
          </Link>
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-primary px-2 py-3">
            로그인
          </Link>
        </nav>
      </div>
    </header>
  )
}

