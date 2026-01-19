'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const HeaderNav: React.FC = () => {
  const navigation = [
    { name: '소개', href: '/#about' },
    { name: '활동', href: '/activity' },
    { name: '모집', href: '/recruit' },
    { name: '대여', href: '/rental' },
    { name: '문의', href: '/contact' },
    { name: '로그인', href: '/login' },
  ];

  const activityItems = [
    { name: '주요활동', href: '/activity' },
    { name: '스터디', href: '/activity/study' },
    { name: '프로젝트', href: '/activity/project' },
    { name: '모각코', href: '/activity/mogakko' },
  ];

  const [isActivityOpen, setIsActivityOpen] = useState(false);

  return (
    <header className="border-b border-[#e2d8c9] bg-[#f7f2e9]/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Do,um logo"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold tracking-wide">Do,um</span>
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase text-[#4b4b4b] sm:flex">
          {navigation.map((item) => {
            if (item.name !== '활동') {
              return (
                <Link key={item.name} href={item.href} className="transition-colors hover:text-[#7aa4e8]">
                  {item.name}
                </Link>
              );
            }

            return (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setIsActivityOpen(true)}
                onMouseLeave={() => setIsActivityOpen(false)}
                onFocus={() => setIsActivityOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsActivityOpen(false);
                  }
                }}
              >
                <Link
                  href={item.href}
                  className="transition-colors hover:text-[#7aa4e8]"
                  onClick={(event) => {
                    if (!isActivityOpen) {
                      event.preventDefault();
                      setIsActivityOpen(true);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setIsActivityOpen(false);
                    }
                  }}
                >
                  {item.name}
                </Link>
                <div
                  className={`absolute left-1/2 top-full mt-2 w-40 -translate-x-1/2 rounded-lg border border-[#e2d8c9] bg-white/90 py-2 text-left text-[11px] font-semibold text-[#4b4b4b] shadow-lg backdrop-blur transition ${
                    isActivityOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <span className="absolute -top-3 left-0 h-3 w-full" />
                  {activityItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className="block px-3 py-2 transition-colors hover:bg-[#f7efe6] hover:text-[#7aa4e8]"
                      onClick={() => setIsActivityOpen(false)}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export { HeaderNav };
