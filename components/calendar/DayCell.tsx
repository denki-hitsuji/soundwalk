"use client";

import { PerformanceWithActs } from "@/lib/db/performances";
import { toYmdLocal } from "@/lib/utils/date";

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
};

type DayCellProps = {
  day: CalendarDay;
  performances: PerformanceWithActs[];
  isSelected: boolean;
  onClick: (date: string) => void;
};

// ステータス別のスタイルマップ（GoogleSheetsチップ風）
const statusStyleMap: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "bg-green-50", text: "text-green-800" },
  offered: { bg: "bg-blue-50", text: "text-blue-800" },
  pending_reconfirm: { bg: "bg-yellow-50", text: "text-yellow-800" },
};

export function DayCell({ day, performances, isSelected, onClick }: DayCellProps) {
  const today = toYmdLocal();
  const isToday = day.date === today;
  const isWeekStart = new Date(day.date).getDay() === 0; // Sunday

  // 最大2つまで表示
  const visiblePerformances = performances.slice(0, 2);
  const remainingCount = performances.length - 2;

  // パフォーマンスチップを生成
  const performanceChips = visiblePerformances.map((perf, i) => {
    const status = perf.status || "unknown";
    const style = statusStyleMap[status] || { bg: "bg-gray-50", text: "text-gray-700" };

    // ①企画名（event_title）優先、②会場名（venue_name）
    const displayName = perf.event_title || perf.venue_name || "未設定";

    return (
      <div
        key={i}
        className={`px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium truncate ${style.bg} ${style.text}`}
        title={`${displayName} - ${
          Array.isArray(perf.acts)
            ? perf.acts.map((act) => act.name).join(", ") || "名義未設定"
            : perf.acts?.name || "名義未設定"
        }`}
      >
        {displayName}
      </div>
    );
  });

  return (
    <button
      onClick={() => onClick(day.date)}
      aria-label={`${day.date} ${performances.length}件のライブ`}
      className={`
        relative h-16 md:h-24 w-full p-1.5 md:p-2 text-left transition-colors flex flex-col
        ${isToday ? "bg-blue-50" : ""}
        ${!day.isCurrentMonth ? "text-gray-400 bg-gray-50" : ""}
        ${isWeekStart && !isToday ? "border-t border-gray-200" : ""}
        ${isSelected ? "ring-2 ring-blue-500 ring-inset" : ""}
        hover:bg-gray-100
      `}
    >
      {/* 日付番号 */}
      <div
        className={`text-sm font-medium mb-1 ${
          isToday ? "text-blue-600 font-bold" : ""
        }`}
      >
        {day.dayNumber}
      </div>

      {/* パフォーマンスチップ */}
      {performances.length > 0 && (
        <div className="flex-1 flex flex-col gap-0.5 overflow-hidden min-w-0">
          {performanceChips}
          {remainingCount > 0 && (
            <div className="text-[10px] text-gray-500 font-medium px-1">
              +{remainingCount}件
            </div>
          )}
        </div>
      )}
    </button>
  );
}
