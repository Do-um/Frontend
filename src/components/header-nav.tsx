'use client';

import React from 'react';
import Link from 'next/link';

const HeaderNav: React.FC = () => {
  const navigation = [
    { name: '소개', href: '/#about' },
    { name: '활동', href: '/activity' },
    { name: '모집', href: '/recruit' },
    { name: '문의', href: '/contact' },
    { name: '로그인', href: '/login' },
  ];

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
                <div className="pointer-events-none absolute right-0 top-full mt-2 w-36 rounded-lg border border-[#e2d8c9] bg-white/90 py-2 text-left text-[11px] font-semibold text-[#4b4b4b] opacity-0 shadow-lg backdrop-blur transition group-hover:pointer-events-auto group-hover:opacity-100">
                  {activityItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className="block px-3 py-2 transition-colors hover:bg-[#f7efe6] hover:text-[#7aa4e8]"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
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
  );
};

export { HeaderNav };
