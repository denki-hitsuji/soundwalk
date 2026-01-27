"use client";

import Link from "next/link";
import { PerformanceWithActs } from "@/lib/db/performances";
import { fmtMMdd } from "@/lib/utils/date";

type PerformancePopupProps = {
  date: string; // YYYY-MM-DD
  performances: PerformanceWithActs[];
  onClose: () => void;
};

const statusLabelMap: Record<string, string> = {
  offered: "オファー中",
  pending_reconfirm: "要再確認",
  confirmed: "確定",
  canceled: "キャンセル",
};

const statusStyleMap: Record<string, string> = {
  offered: "bg-blue-100 text-blue-800",
  pending_reconfirm: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  canceled: "bg-gray-100 text-gray-500",
};

export function PerformancePopup({
  date,
  performances,
  onClose,
}: PerformancePopupProps) {
  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = `${dateObj.getFullYear()}年${
    dateObj.getMonth() + 1
  }月${dateObj.getDate()}日 (${["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()]})`;

  return (
    <div className="mt-4 p-4 bg-white border rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{formattedDate}のライブ</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {performances.map((perf) => {
          const actName =
            typeof perf.acts === "object" && perf.acts !== null && "name" in perf.acts
              ? perf.acts.name
              : Array.isArray(perf.acts) && perf.acts.length > 0
              ? perf.acts[0].name
              : "名義未設定";

          const status = perf.status || "unknown";
          const statusLabel = statusLabelMap[status] || status;
          const statusStyle = statusStyleMap[status] || "bg-gray-100 text-gray-600";

          return (
            <Link
              key={perf.id}
              href={`/musician/performances/${perf.id}`}
              className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {perf.venue_name || "会場未定"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{actName}</div>
                  {perf.start_time && (
                    <div className="text-xs text-gray-500 mt-1">
                      開演: {perf.start_time.substring(0, 5)}
                    </div>
                  )}
                  {perf.memo && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {perf.memo}
                    </div>
                  )}
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusStyle}`}
                >
                  {statusLabel}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {performances.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          この日のライブはありません
        </p>
      )}
    </div>
  );
}
