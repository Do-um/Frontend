'use client';

import React from 'react';
import { SiteHeader } from '@/components/layout';

const Dashboard: React.FC = () => {
  const programs = [
    { title: '타전공', desc: '활동' },
    { title: '파이썬 기초교육', desc: '활동' },
    { title: '꿀정보 도전', desc: '활동' },
    { title: '강의 센트리', desc: '활동' },
    { title: '스터디', desc: '활동' },
    { title: '모각코', desc: '활동' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f2e9] text-[#2b2b2b]">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-12">
        <section className="flex flex-col items-center text-center gap-4 py-10">
          <p className="text-xs tracking-[0.2em] text-[#7aa4e8]">Do,um</p>
          <h1 className="text-2xl font-semibold leading-relaxed sm:text-3xl">
            학습을 통한 성장
            <br />
            성장을 통한 나눔
          </h1>
          <button className="rounded-full bg-[#a7c1f0] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8fb0ec]">
            시작하기
          </button>
        </section>

        <section className="rounded-2xl border border-[#c9c0b3] bg-white/70 px-6 py-7 shadow-sm">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Do,um?</h2>
            <p className="text-xs text-[#6a6259] leading-relaxed">
              &apos;함께하고싶어&apos;의 줄임말로, 서로의 배움을 나누고 성장을 만들어가는 커뮤니티입니다.
              다양한 전공과 경험을 가진 사람들이 함께 모여 고민하고 나눔을 확장합니다.
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-semibold">정규 활동</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {programs.map((program) => (
                <div
                  key={program.title}
                  className="rounded-xl bg-[#f7efe6] px-4 py-3 text-sm font-semibold text-[#3a342d]"
                >
                  <div>{program.title}</div>
                  <div className="text-[11px] font-medium text-[#8a7f73]">{program.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <h3 className="text-xs font-semibold">우리는 어떤 꿈을 같이 있을까요?</h3>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="h-24 rounded-lg bg-[#e2ddd6]" />
              <div className="flex items-center text-xs font-semibold text-[#4f4841]">
                간단한 활동 설명
              </div>
              <div className="flex items-center text-xs font-semibold text-[#4f4841]">
                간단한 활동 설명
              </div>
              <div className="h-24 rounded-lg bg-[#e2ddd6]" />
              <div className="h-24 rounded-lg bg-[#e2ddd6]" />
              <div className="flex items-center text-xs font-semibold text-[#4f4841]">
                간단한 활동 설명
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-xs font-semibold text-[#4f4841]">자기계발을 위한</p>
          <h3 className="text-sm font-semibold">다양한 스터디와 작품활동 진행</h3>
          <div className="mt-4 h-24 rounded-xl bg-[#dcd5ce]" />
        </section>
      </main>

      <footer className="border-t border-[#e2d8c9] py-6 text-center text-xs text-[#6a6259]">
        <div className="font-semibold text-[#3f3a34]">DO,UM</div>
        <div className="mt-1">소프트웨어학과의 교과외 활동</div>
        <div className="mt-1">Contact: doum@dokim.ac.kr</div>
        <div className="mt-3 text-[10px] text-[#8a7f73]">© DO,UM</div>
      </footer>
    </div>
  );
};

export default Dashboard;
