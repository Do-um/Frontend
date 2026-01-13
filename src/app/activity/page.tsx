import React from 'react';
import { SiteHeader } from '@/components/layout';

const activities: Array<{ title: string; date: string; duration: string }> = [];

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-[#f7f2e9] text-[#2b2b2b]">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-10">
        <section className="flex flex-col items-center text-center gap-4">
          <div className="flex h-28 w-44 items-center justify-center">
            <img
              src="/doum-logo-large.png"
              alt="Do,um"
              className="h-28 w-44 object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Our Activity</h1>
          <p className="text-xs text-[#6a6259]">우리가 해온 길, 우리가 가는 길</p>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">주요활동</h2>
            <button className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold text-[#4b4b4b]">
              작성하기
            </button>
          </div>

          {activities.length > 0 && (
            <>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activities.map((activity) => (
                  <article
                    key={activity.title}
                    className="overflow-hidden rounded-2xl border border-[#e5ddd1] bg-white shadow-sm"
                  >
                    <div className="flex h-24 items-center justify-center bg-[#cfe0e6]">
                      <div className="h-12 w-16 rounded-full border border-[#aac4ce] bg-[#dbe9ee]" />
                    </div>
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold">{activity.title}</h3>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#7a7268]">
                        <span>{activity.date}</span>
                        <span className="rounded-full bg-[#f1ebe3] px-2 py-0.5 text-[10px] font-semibold text-[#6a6259]">
                          {activity.duration}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 text-xs text-[#6a6259]">
                <button className="hover:text-[#7aa4e8]">이전</button>
                <button className="font-semibold text-[#2b2b2b]">1</button>
                <button className="hover:text-[#7aa4e8]">2</button>
                <button className="hover:text-[#7aa4e8]">3</button>
                <button className="hover:text-[#7aa4e8]">4</button>
                <button className="hover:text-[#7aa4e8]">5</button>
                <button className="hover:text-[#7aa4e8]">다음</button>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-[#e2d8c9] py-6 text-center text-xs text-[#6a6259]">
        <div className="font-semibold text-[#3f3a34]">DO,UM</div>
        <div className="mt-1">소프트웨어학과의 코딩봉사 동아리</div>
        <div className="mt-1">Contact: doum2018@dokim.ac.kr</div>
        <div className="mt-3 text-[10px] text-[#8a7f73]">© DO,UM</div>
      </footer>
    </div>
  );
}
