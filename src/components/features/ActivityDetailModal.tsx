'use client';

import React, { useEffect } from 'react';
import { DetailCarousel } from '@/components/features/DetailCarousel';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  items: Array<{ id: string; color?: string; imageUrl?: string; label?: string }>;
}

const ActivityDetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  items,
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
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="rounded-full border border-[#e2d8c9] px-3 py-1 text-xs font-semibold text-[#4b4b4b]"
          >
            닫기
          </button>
        </div>

        <DetailCarousel items={items} />

        <section className="mt-8">
          <p className="text-sm font-semibold">설명</p>
          <h3 className="mt-3 text-center text-base font-semibold">{subtitle}</h3>
        </section>
      </div>
    </div>
  );
};

export { ActivityDetailModal };
