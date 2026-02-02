"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// ========== 헤더 네비게이션 컴포넌트 ==========
// 모든 페이지에서 공통으로 사용하는 헤더 컴포넌트
// 소개 버튼에 드롭다운 메뉴 포함

export function HeaderNav() {
  // '소개' 메뉴 드롭다운 표시 여부
  const [isIntroOpen, setIsIntroOpen] = useState(false)
  // '활동' 메뉴 드롭다운 표시 여부
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(false)

  return (
    // 전체 페이지 상단에 고정해서 재사용하는 헤더 영역
    <header className="w-full border-b border-gray-200 bg-transparent px-8 py-4">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="Do,um 로고" width={45} height={45} priority />
        </Link>

        {/* 상단 네비게이션 메뉴 목록 */}
        <nav className="flex items-center gap-6">
          {/* 마우스 오버 시 '소개' 하위 메뉴를 표시 */}
          <div
            className="relative"
            onMouseEnter={() => setIsIntroOpen(true)}
            onMouseLeave={() => setIsIntroOpen(false)}
          >
            <button className="text-sm font-medium transition-colors hover:text-primary px-4 py-3">소개</button>

            {/* 소개 드롭다운 */}
            {isIntroOpen && (
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

          {/* 마우스 오버 시 '활동' 하위 메뉴를 표시 */}
          <div
            className="relative"
            onMouseEnter={() => setIsActivitiesOpen(true)}
            onMouseLeave={() => setIsActivitiesOpen(false)}
          >
            <button className="text-sm font-medium transition-colors hover:text-primary px-2 py-3">활동</button>

            {/* 활동 드롭다운 */}
            {isActivitiesOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-auto rounded-md border bg-white shadow-md py-1 z-50">
                <Link
                  href="/activities"
                  className="block px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 whitespace-nowrap"
                >
                  주요활동
                </Link>
                <Link
                  href="/activities/projects"
                  className="block px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 whitespace-nowrap"
                >
                  프로젝트
                </Link>
                <Link
                  href="/activities/study"
                  className="block px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 whitespace-nowrap"
                >
                  스터디
                </Link>
                <Link
                  href="/activities/mogakko"
                  className="block px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 whitespace-nowrap"
                >
                  모각코
                </Link>
              </div>
            )}
          </div>
          <Link href="/recruit" className="text-sm font-medium transition-colors hover:text-primary px-2 py-3">
            모집
          </Link>
          <Link href="/rental" className="text-sm font-medium transition-colors hover:text-primary px-2 py-3">
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

