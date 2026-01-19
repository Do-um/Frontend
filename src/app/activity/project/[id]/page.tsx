import React from 'react';
import { SiteHeader } from '@/components/layout';
import { DetailCarousel } from '@/components/features/DetailCarousel';

const detail = {
  title: '2025-2 프로젝트',
  subtitle: '2025-2 두움 프로젝트',
  description: '설명',
  colors: [
    { id: '1', color: '#9aa043' },
    { id: '2', color: '#dfe0c3' },
    { id: '3', color: '#bfe6ff' },
    { id: '4', color: '#e8b9b8' },
    { id: '5', color: '#d73a2a' },
  ],
};

export default function ProjectDetailPage() {
  return (
    <div className="min-h-screen bg-[#f7f2e9] text-[#2b2b2b]">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-12">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">{detail.title}</h1>
          <span className="h-4 w-4 rounded-full bg-[#d73a2a]" />
        </div>

        <DetailCarousel items={detail.colors} />

        <section className="mt-10">
          <p className="text-sm font-semibold">설명</p>
          <h2 className="mt-4 text-center text-lg font-semibold">{detail.subtitle}</h2>
        </section>
      </main>
    </div>
  );
}
