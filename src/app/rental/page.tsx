'use client';

import React, { useState } from 'react';
import { SiteHeader } from '@/components/layout';
import { RentalDetailModal } from '@/components/features/RentalDetailModal';

const rentals: Array<{
  id: string;
  title: string;
  date: string;
  participants: string[];
  reservations: Array<{
    id: string;
    renter: string;
    reason: string;
    startDate: string;
    endDate: string;
    timeRange: string;
  }>;
}> = [
  {
    id: '1',
    title: 'Smart Cute Bot',
    date: '2025-12-01',
    participants: ['홍길동', '박명수'],
    reservations: [
      {
        id: 'r1',
        renter: '백경준',
        reason: '동계 봉사',
        startDate: '2026-01-23',
        endDate: '2026-01-26',
        timeRange: '00 ~ 23:59',
      },
      {
        id: 'r2',
        renter: '박지민',
        reason: '연습 촬영',
        startDate: '2026-01-07',
        endDate: '2026-01-07',
        timeRange: '10:00 ~ 13:00',
      },
    ],
  },
  {
    id: '2',
    title: '빔프로젝터',
    date: '2025-12-01',
    participants: ['김지민', '오수민', '이준호'],
    reservations: [
      {
        id: 'r3',
        renter: '김다은',
        reason: '발표 준비',
        startDate: '2026-01-03',
        endDate: '2026-01-04',
        timeRange: '18:00 ~ 22:00',
      },
    ],
  },
  {
    id: '3',
    title: '노트북',
    date: '2025-12-01',
    participants: ['정다은'],
    reservations: [
      {
        id: 'r4',
        renter: '정다은',
        reason: '프로젝트 작업',
        startDate: '2026-01-12',
        endDate: '2026-01-16',
        timeRange: '09:00 ~ 18:00',
      },
    ],
  },
  {
    id: '4',
    title: '마이크',
    date: '2025-12-01',
    participants: ['장예린', '하준'],
    reservations: [
      {
        id: 'r5',
        renter: '하준',
        reason: '녹음',
        startDate: '2026-01-25',
        endDate: '2026-01-25',
        timeRange: '14:00 ~ 16:00',
      },
    ],
  },
  {
    id: '5',
    title: '태블릿',
    date: '2025-12-01',
    participants: ['윤서진', '최재훈', '박성우', '윤하'],
    reservations: [
      {
        id: 'r6',
        renter: '윤서진',
        reason: '스터디',
        startDate: '2026-01-28',
        endDate: '2026-01-30',
        timeRange: '13:00 ~ 17:00',
      },
    ],
  },
  {
    id: '6',
    title: '카메라 렌즈',
    date: '2025-12-01',
    participants: ['임도현', '서유진'],
    reservations: [
      {
        id: 'r7',
        renter: '임도현',
        reason: '촬영',
        startDate: '2026-01-19',
        endDate: '2026-01-19',
        timeRange: '09:00 ~ 12:00',
      },
    ],
  },
];

const formatParticipants = (participants: string[]) => {
  if (participants.length <= 2) {
    return participants.join(', ');
  }
  return `${participants[0]}, ${participants[1]} 등`;
};

export default function RentalPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRental = rentals.find((rental) => rental.id === selectedId);

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
          <h1 className="text-2xl font-semibold sm:text-3xl">Our Rental</h1>
          <p className="text-xs text-[#6a6259]">우리가 해온 길, 우리가 가는 길</p>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">대여</h2>
            <button className="rounded-full border border-[#cfc4b3] px-3 py-1 text-xs font-semibold text-[#4b4b4b]">
              작성하기
            </button>
          </div>

          {rentals.length > 0 && (
            <>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rentals.map((rental) => (
                  <button
                    key={rental.id}
                    type="button"
                    onClick={() => setSelectedId(rental.id)}
                    className="overflow-hidden rounded-2xl border border-[#e5ddd1] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-24 items-center justify-center bg-[#cfe0e6]">
                      <div className="h-12 w-16 rounded-full border border-[#aac4ce] bg-[#dbe9ee]" />
                    </div>
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold">{rental.title}</h3>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#7a7268]">
                        <span>{rental.date}</span>
                        <span className="text-[10px] font-semibold text-[#6a6259]">
                          {formatParticipants(rental.participants)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <RentalDetailModal
        isOpen={Boolean(selectedRental)}
        onClose={() => setSelectedId(null)}
        title={selectedRental?.title ?? ''}
        reservations={selectedRental?.reservations ?? []}
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
