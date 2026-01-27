"use client";

import { useMemo } from "react";
import { PerformanceWithActs } from "@/lib/db/performances";
import { DayCell, CalendarDay } from "./DayCell";
import { toYmdLocal, addDaysLocal } from "@/lib/utils/date";

type MonthViewProps = {
  year: number;
  month: number; // 0-indexed (0 = January)
  performancesByDate: Record<string, PerformanceWithActs[]>;
  selectedDate: string | null;
  onDateClick: (date: string) => void;
};

function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay(); // 0=Sunday

  const days: CalendarDay[] = [];

  // 前月の末尾日を埋める
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = addDaysLocal(firstDay, -i - 1);
    days.push({
      date: toYmdLocal(date),
      dayNumber: date.getDate(),
      isCurrentMonth: false,
    });
  }

  // 当月の日付
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i);
    days.push({
      date: toYmdLocal(date),
      dayNumber: i,
      isCurrentMonth: true,
    });
  }

  // 次月の先頭日を埋める（7の倍数になるまで）
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const date = addDaysLocal(lastDay, i);
      days.push({
        date: toYmdLocal(date),
        dayNumber: date.getDate(),
        isCurrentMonth: false,
      });
    }
  }

  return days;
}

export function MonthView({
  year,
  month,
  performancesByDate,
  selectedDate,
  onDateClick,
}: MonthViewProps) {
  const calendarDays = useMemo(
    () => generateCalendarDays(year, month),
    [year, month]
  );

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-0 bg-gray-50 border-b">
        {weekdays.map((day, idx) => (
          <div
            key={day}
            className={`text-center py-2 text-xs font-medium ${
              idx === 0 ? "text-red-600" : idx === 6 ? "text-blue-600" : "text-gray-600"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-0">
        {calendarDays.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            performances={performancesByDate[day.date] || []}
            isSelected={selectedDate === day.date}
            onClick={onDateClick}
          />
        ))}
      </div>
    </div>
  );
}
