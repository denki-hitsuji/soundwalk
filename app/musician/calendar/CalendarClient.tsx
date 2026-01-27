"use client";

import { useState, useMemo } from "react";
import { PerformanceWithActs } from "@/lib/db/performances";
import { MonthView } from "@/components/calendar/MonthView";
import { PerformancePopup } from "@/components/calendar/PerformancePopup";

type CalendarClientProps = {
  performances: PerformanceWithActs[];
};

export default function CalendarClient({ performances }: CalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // パフォーマンスを日付でグルーピング
  const performancesByDate = useMemo(() => {
    const map: Record<string, PerformanceWithActs[]> = {};
    for (const perf of performances) {
      if (!map[perf.event_date]) {
        map[perf.event_date] = [];
      }
      map[perf.event_date].push(perf);
    }
    return map;
  }, [performances]);

  // 月切り替え
  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      return newDate;
    });
    setSelectedDate(null);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー: 前月/次月ボタン */}
      <header className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeMonth(-1)}
          className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        >
          ← 前月
        </button>
        <h2 className="text-xl font-bold text-gray-900">
          {year}年 {month + 1}月
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        >
          次月 →
        </button>
      </header>

      {/* カレンダーグリッド */}
      <MonthView
        year={year}
        month={month}
        performancesByDate={performancesByDate}
        selectedDate={selectedDate}
        onDateClick={setSelectedDate}
      />

      {/* 選択日のパフォーマンス一覧 */}
      {selectedDate && performancesByDate[selectedDate] && (
        <PerformancePopup
          date={selectedDate}
          performances={performancesByDate[selectedDate]}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
