"use client";

import { useState, useMemo } from "react";
import { MonthView } from "@/components/calendar/MonthView";
import { EventPopup } from "@/components/calendar/EventPopup";

type VenueCalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_id: string;
  venue_name?: string | null;
  max_artists: number | null;
  acceptedCount: number;
  status: string;
};

type VenueCalendarClientProps = {
  events: VenueCalendarEvent[];
};

export default function VenueCalendarClient({
  events,
}: VenueCalendarClientProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // イベントを日付でグルーピング（DayCellで表示するため event_title にマッピング）
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const event of events) {
      if (!map[event.event_date]) {
        map[event.event_date] = [];
      }
      // DayCell用に event_title フィールドを追加（空の場合は "(企画名未設定)"）
      map[event.event_date].push({
        ...event,
        event_title: event.title || "(企画名未設定)",
      });
    }
    return map;
  }, [events]);

  // 月切り替え
  const changeMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      return newDate;
    });
    setSelectedDate(null);
  };

  // 日付クリック時の処理
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
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
        performancesByDate={eventsByDate}
        selectedDate={selectedDate}
        onDateClick={handleDateClick}
      />

      {/* 選択日のイベント一覧 */}
      {selectedDate && (
        <EventPopup
          date={selectedDate}
          events={eventsByDate[selectedDate] || []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
