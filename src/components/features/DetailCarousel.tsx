'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface CarouselItem {
  id: string;
  color?: string;
  imageUrl?: string;
  label?: string;
}

interface DetailCarouselProps {
  items: CarouselItem[];
}

const DetailCarousel: React.FC<DetailCarouselProps> = ({ items }) => {
  const [orderedItems, setOrderedItems] = useState<CarouselItem[]>(items);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideWidth = 320;
  const slideGap = 16;

  const renderItems = useMemo(() => {
    if (orderedItems.length === 0) {
      return [];
    }
    if (orderedItems.length === 1) {
      return orderedItems;
    }
    const last = orderedItems[orderedItems.length - 1];
    const first = orderedItems[0];
    const secondLast = orderedItems[orderedItems.length - 2] ?? last;
    const second = orderedItems[1] ?? first;
    return [secondLast, last, ...orderedItems, first, second];
  }, [orderedItems]);

  const translateX = useMemo(() => {
    const step = slideWidth + slideGap;
    const baseOffset = orderedItems.length > 1 ? -2 * step : 0;
    return `calc(50% - ${slideWidth / 2}px + ${baseOffset}px + ${offset * step}px)`;
  }, [offset, orderedItems.length]);

  if (items.length === 0) {
    return null;
  }

  useEffect(() => {
    setOrderedItems(items);
    setOffset(0);
    setIsAnimating(false);
  }, [items]);

  const handlePrev = () => {
    if (items.length <= 1 || isAnimating) {
      return;
    }
    setIsAnimating(true);
    setOffset(1);
  };

  const handleNext = () => {
    if (items.length <= 1 || isAnimating) {
      return;
    }
    setIsAnimating(true);
    setOffset(-1);
  };

  return (
    <div className="relative mt-8">
      <button
        type="button"
        aria-label="이전"
        onClick={handlePrev}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-xl shadow transition hover:bg-white disabled:opacity-50"
        disabled={items.length <= 1 || isAnimating}
      >
        ‹
      </button>
      <div className="overflow-hidden rounded-2xl">
        <div
          className={`flex items-center gap-4 will-change-transform ${isAnimating ? 'transition-transform duration-200 ease-in-out' : ''}`}
          style={{ transform: `translate3d(${translateX}, 0, 0)` }}
          onTransitionEnd={() => {
            if (items.length <= 1) {
              return;
            }
            if (!isAnimating) {
              return;
            }
            setIsAnimating(false);
            if (offset === -1) {
              setOrderedItems((prev) => {
                const [first, ...rest] = prev;
                return [...rest, first];
              });
            }
            if (offset === 1) {
              setOrderedItems((prev) => {
                const last = prev[prev.length - 1];
                return [last, ...prev.slice(0, -1)];
              });
            }
            setOffset(0);
          }}
        >
          {renderItems.map((item, itemIndex) => {
            const hasImage = Boolean(item.imageUrl);
            const style = hasImage
              ? { backgroundImage: `url(${item.imageUrl})` }
              : { backgroundColor: item.color ?? '#e2ddd6' };

            return (
              <div
                key={`${item.id}-${itemIndex}`}
                className={`h-[220px] w-[320px] shrink-0 rounded-2xl shadow ${hasImage ? 'bg-cover bg-center' : ''}`}
                style={style}
                aria-label={item.label ?? 'carousel item'}
              />
            );
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label="다음"
        onClick={handleNext}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 text-xl shadow transition hover:bg-white disabled:opacity-50"
        disabled={items.length <= 1 || isAnimating}
       >
        ›
      </button>
    </div>
  );
};

export { DetailCarousel };
