import React from 'react';
import { SiteHeader } from '@/components/layout';

export default function ProjectActivityPage() {
  return (
    <div className="min-h-screen bg-[#f7f2e9] text-[#2b2b2b]">
      <SiteHeader />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-14 text-center">
        <h1 className="text-2xl font-semibold sm:text-3xl">프로젝트</h1>
        <p className="mt-3 text-xs text-[#6a6259]">
          프로젝트 활동을 소개하는 페이지입니다. 준비된 콘텐츠로 채워주세요.
        </p>
        <div className="mt-8 h-40 w-full max-w-xl rounded-2xl bg-[#ded7cf]" />
      </main>

      <footer className="border-t border-[#e2d8c9] py-6 text-center text-xs text-[#6a6259]">
        <div className="font-semibold text-[#3f3a34]">DO,UM</div>
        <div className="mt-1">소프트웨어학과의 교과외 활동</div>
        <div className="mt-1">Contact: doum@dokim.ac.kr</div>
        <div className="mt-3 text-[10px] text-[#8a7f73]">© DO,UM</div>
      </footer>
    </div>
  );
}
