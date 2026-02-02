"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PerformanceWithActs } from "@/lib/db/performances";
import { ActRow } from "@/lib/utils/acts";
import { MonthView } from "@/components/calendar/MonthView";
import { PerformancePopup } from "@/components/calendar/PerformancePopup";
import { InlinePerformanceForm } from "@/components/calendar/InlinePerformanceForm";

type CalendarClientProps = {
  performances: PerformanceWithActs[];
  myActs: ActRow[];
  userId: string;
};

export default function CalendarClient({
  performances,
  myActs,
  userId,
}: CalendarClientProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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
    setShowAddForm(false);
  };

  // 日付クリック時の処理
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    // 予定がない日はフォームを表示、ある日はポップアップを表示
    const hasPerformances = performancesByDate[date]?.length > 0;
    setShowAddForm(!hasPerformances);
  };

  // フォームから追加ボタンをクリック
  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  // 保存完了時
  const handleSaved = () => {
    setShowAddForm(false);
    setSelectedDate(null);
    router.refresh();
  };

  // キャンセル時
  const handleCancel = () => {
    setShowAddForm(false);
    if (!performancesByDate[selectedDate || ""]?.length) {
      setSelectedDate(null);
    }
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
        onDateClick={handleDateClick}
      />

      {/* 選択日のパフォーマンス一覧（予定がある日で、フォーム非表示時） */}
      {selectedDate &&
        performancesByDate[selectedDate]?.length > 0 &&
        !showAddForm && (
          <PerformancePopup
            date={selectedDate}
            performances={performancesByDate[selectedDate]}
            onClose={() => setSelectedDate(null)}
            onAddClick={handleShowAddForm}
          />
        )}

      {/* インライン予定追加フォーム */}
      {selectedDate && showAddForm && (
        <InlinePerformanceForm
          date={selectedDate}
          myActs={myActs}
          userId={userId}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
