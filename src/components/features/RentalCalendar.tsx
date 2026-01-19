'use client';

import React, { useMemo, useState } from 'react';

interface RentalReservation {
  id: string;
  renter: string;
  reason: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  timeRange: string;
}

interface RentalCalendarProps {
  reservations: RentalReservation[];
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const toDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isDateInRange = (date: Date, start: Date, end: Date) =>
  date.getTime() >= start.getTime() && date.getTime() <= end.getTime();

const RentalCalendar: React.FC<RentalCalendarProps> = ({ reservations }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredReservation, setHoveredReservation] = useState<RentalReservation | null>(null);
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null);

  const monthStart = currentMonth;
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const monthName = monthNames[currentMonth.getMonth()];
  const yearLabel = currentMonth.getFullYear();

  const leadingEmptyDays = useMemo(() => {
    const day = monthStart.getDay(); // 0 Sun ... 6 Sat
    return day === 0 ? 6 : day - 1;
  }, [monthStart]);

  const days = useMemo(() => {
    const total = monthEnd.getDate();
    return Array.from({ length: total }, (_, index) => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), index + 1));
  }, [monthEnd, currentMonth]);

  const reservationMap = useMemo(() => {
    return reservations.map((reservation) => ({
      reservation,
      start: toDate(reservation.startDate),
      end: toDate(reservation.endDate),
    }));
  }, [reservations]);

  const getReservationForDate = (date: Date) => {
    return reservationMap.find(({ start, end }) => isDateInRange(date, start, end))?.reservation ?? null;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <div className="rounded-2xl border border-[#e5ddd1] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-full border border-[#e2d8c9] px-3 py-1 text-sm font-semibold text-[#4b4b4b]"
          >
            ‹
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-[#e2d8c9] px-3 py-1 text-sm font-semibold text-[#4b4b4b]">
              {monthName}
            </span>
            <span className="rounded-lg border border-[#e2d8c9] px-3 py-1 text-sm font-semibold text-[#4b4b4b]">
              {yearLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-full border border-[#e2d8c9] px-3 py-1 text-sm font-semibold text-[#4b4b4b]"
          >
            ›
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[#6a6259]">
          {weekDays.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[#2b2b2b]">
          {Array.from({ length: leadingEmptyDays }).map((_, index) => (
            <div key={`empty-${index}`} className="h-9" />
          ))}
          {days.map((date) => {
            const reservation = getReservationForDate(date);
            const dateKey = date.toISOString();
            const isToday = isSameDay(date, today);
            return (
              <div key={dateKey} className="relative">
                <div
                  className={`flex h-9 items-center justify-center rounded-lg border ${
                    reservation
                      ? 'border-[#bcd0ff] bg-[#dfe6ff] text-[#2f56d9]'
                      : 'border-[#f0ede6] bg-white'
                  } ${isToday ? 'border-[#7aa4e8]' : ''}`}
                  onMouseEnter={() => {
                    setHoveredReservation(reservation);
                    setHoveredDateKey(dateKey);
                  }}
                  onMouseLeave={() => {
                    setHoveredReservation(null);
                    setHoveredDateKey(null);
                  }}
                >
                  {date.getDate()}
                </div>
                {reservation &&
                  hoveredReservation?.id === reservation.id &&
                  hoveredDateKey === dateKey && (
                  <div className="absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-lg border border-[#e2d8c9] bg-white p-3 text-left text-[11px] font-semibold text-[#2b2b2b] shadow-lg">
                    <div>대여자 : {reservation.renter}</div>
                    <div className="mt-1">대여 사유 : {reservation.reason}</div>
                    <div className="mt-1">사용 시간대 : {reservation.timeRange}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 text-xs text-[#4b4b4b]">
        <div className="flex items-center gap-2">
          <span className="h-6 w-10 rounded-md bg-[#dfe6ff]" />
          <span className="font-semibold">사용 불가 일자</span>
        </div>
        <p className="text-[11px] text-[#6a6259]">
          대여중인 물품의 사용 시간대 외의 사용은 대여자에게 확인 후 사용 바랍니다.
        </p>
      </div>
    </div>
  );
};

export { RentalCalendar };
