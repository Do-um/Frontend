'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface SiteHeaderProps {
  className?: string;
}

const SiteHeader: React.FC<SiteHeaderProps> = ({ className }) => {
  const navigation = [
    { name: '소개', href: '/#about' },
    { name: '활동', href: '/activity' },
    { name: '모집', href: '/recruit' },
    { name: '문의', href: '/contact' },
    { name: '로그인', href: '/login' },
  ];

  const activityItems = [
    { name: '주요활동', href: '/activity' },
    { name: '스터디', href: '/activity/study' },
    { name: '프로젝트', href: '/activity/project' },
    { name: '모각코', href: '/activity/mogakko' },
  ];

  return (
    <header className={cn('border-b border-[#e2d8c9] bg-[#f7f2e9]/80 backdrop-blur', className)}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Do,um logo"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold tracking-wide">Do,um</span>
        </a>
        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase text-[#4b4b4b] sm:flex">
          {navigation.map((item) => {
            if (item.name !== '활동') {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="transition-colors hover:text-[#7aa4e8]"
                >
                  {item.name}
                </a>
              );
            }

            return (
              <div key={item.name} className="relative group">
                <a
                  href={item.href}
                  className="transition-colors hover:text-[#7aa4e8]"
                >
                  {item.name}
                </a>
                <div className="pointer-events-none absolute right-0 top-full mt-2 w-36 rounded-lg border border-[#e2d8c9] bg-white/90 py-2 text-left text-[11px] font-semibold text-[#4b4b4b] opacity-0 shadow-lg backdrop-blur transition group-hover:pointer-events-auto group-hover:opacity-100">
                  {activityItems.map((subItem) => (
                    <a
                      key={subItem.name}
                      href={subItem.href}
                      className="block px-3 py-2 transition-colors hover:bg-[#f7efe6] hover:text-[#7aa4e8]"
                    >
                      {subItem.name}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <button className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold sm:hidden">
          메뉴
        </button>
      </div>
    </header>
  );
};

export { SiteHeader };
