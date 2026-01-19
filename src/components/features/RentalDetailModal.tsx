'use client';

import React, { useEffect } from 'react';
import { RentalCalendar } from '@/components/features/RentalCalendar';

interface RentalReservation {
  id: string;
  renter: string;
  reason: string;
  startDate: string;
  endDate: string;
  timeRange: string;
}

interface RentalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  reservations: RentalReservation[];
}

const RentalDetailModal: React.FC<RentalDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  reservations,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>
            <span className="h-3 w-3 rounded-full bg-[#d73a2a]" />
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-full border border-[#e2d8c9] px-3 py-1 text-xs font-semibold text-[#4b4b4b]"
          >
            닫기
          </button>
        </div>

        <div className="mt-6">
          <RentalCalendar reservations={reservations} />
        </div>
      </div>
    </div>
  );
};

export { RentalDetailModal };
