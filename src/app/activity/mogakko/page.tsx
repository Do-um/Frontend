'use client';

import React, { useEffect, useState } from 'react';
import { SiteHeader } from '@/components/layout';
import { ActivityDetailModal } from '@/components/features/ActivityDetailModal';

const activities: Array<{
  id: string;
  title: string;
  date: string;
  participants: string[];
}> = [
  { id: '1', title: '2025-2 모각코 A', date: '2025-12-01', participants: ['홍길동', '박명수'] },
  { id: '2', title: '2025-2 모각코 B', date: '2025-12-01', participants: ['김지민', '오수민', '이준호'] },
  { id: '3', title: '2025-2 모각코 C', date: '2025-12-01', participants: ['정다은'] },
  { id: '4', title: '2025-2 모각코 D', date: '2025-12-01', participants: ['장예린', '하준'] },
  { id: '5', title: '2025-1 모각코 E', date: '2025-12-01', participants: ['윤서진', '최재훈', '박성우', '윤하'] },
  { id: '6', title: '2025-1 모각코 F', date: '2025-12-01', participants: ['임도현', '서유진'] },
];

const detailItems = [
  { id: '1', color: '#9aa043', label: 'slide 1' },
  { id: '2', color: '#dfe0c3', label: 'slide 2' },
  { id: '3', color: '#bfe6ff', label: 'slide 3' },
  { id: '4', color: '#e8b9b8', label: 'slide 4' },
  { id: '5', color: '#d73a2a', label: 'slide 5' },
];

const formatParticipants = (participants: string[]) => {
  if (participants.length <= 2) {
    return participants.join(', ');
  }
  return `${participants[0]}, ${participants[1]} 등`;
};

export default function MogakkoActivityPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const selectedActivity = activities.find((activity) => activity.id === selectedId);
  const totalPages = Math.max(1, Math.ceil(activities.length / itemsPerPage));
  const pagedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

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
          <h1 className="text-2xl font-semibold sm:text-3xl">모여서 각자 코딩</h1>
          <p className="text-xs text-[#6a6259]">놀기 위한 명분</p>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <a
              href="/attendance"
              className="text-xs font-semibold text-[#7aa4e8] hover:text-[#5a88d8]"
            >
              출석부로 이동
            </a>
            <button className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold text-[#4b4b4b]">
              작성하기
            </button>
          </div>

          {pagedActivities.length > 0 && (
            <>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pagedActivities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => setSelectedId(activity.id)}
                    className="overflow-hidden rounded-2xl border border-[#e5ddd1] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-24 items-center justify-center bg-[#cfe0e6]">
                      <div className="h-12 w-16 rounded-full border border-[#aac4ce] bg-[#dbe9ee]" />
                    </div>
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold">{activity.title}</h3>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#7a7268]">
                        <span>{activity.date}</span>
                        <span className="text-[10px] font-semibold text-[#6a6259]">
                          {formatParticipants(activity.participants)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 text-xs text-[#6a6259]">
                <button
                  className="hover:text-[#7aa4e8] disabled:opacity-40"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      className={page === currentPage ? 'font-semibold text-[#2b2b2b]' : 'hover:text-[#7aa4e8]'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  className="hover:text-[#7aa4e8] disabled:opacity-40"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      <ActivityDetailModal
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedId(null)}
        title={selectedActivity?.title ?? ''}
        subtitle={`2025-2 두움 ${selectedActivity?.title ?? ''}`}
        items={detailItems}
      />

      <footer className="border-t border-[#e2d8c9] py-6 text-center text-xs text-[#6a6259]">
        <div className="font-semibold text-[#3f3a34]">DO,UM</div>
        <div className="mt-1">소프트웨어학과의 교과외 활동</div>
        <div className="mt-1">Contact: doum@dokim.ac.kr</div>
        <div className="mt-3 text-[10px] text-[#8a7f73]">© DO,UM</div>
      </footer>
    </div>
  );
}
