"use client";

import Link from "next/link";

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

type EventPopupProps = {
  date: string; // YYYY-MM-DD
  events: VenueCalendarEvent[];
  onClose: () => void;
};

const statusLabelMap: Record<string, string> = {
  open: "募集中",
  pending: "準備中",
  draft: "下書き",
  matched: "確定",
  cancelled: "キャンセル",
};

const statusStyleMap: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-600",
  matched: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-500",
};

export function EventPopup({ date, events, onClose }: EventPopupProps) {
  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = `${dateObj.getFullYear()}年${
    dateObj.getMonth() + 1
  }月${dateObj.getDate()}日 (${
    ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()]
  })`;

  return (
    <div className="mt-4 p-4 bg-white border rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{formattedDate}のイベント</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {events.map((event) => {
          const status = event.status || "draft";
          const statusLabel = statusLabelMap[status] || status;
          const statusStyle = statusStyleMap[status] || "bg-gray-100 text-gray-600";

          return (
            <Link
              key={event.id}
              href={`/venue/slots/${event.id}`}
              className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {event.title || "(企画名未設定)"}
                  </div>
                  {event.venue_name && (
                    <div className="text-xs text-gray-600 mt-1">
                      {event.venue_name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {event.start_time.substring(0, 5)} 〜{" "}
                    {event.end_time.substring(0, 5)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    決定組数: {event.acceptedCount} /{" "}
                    {event.max_artists ?? "無制限"}
                  </div>
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

      {events.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          この日のイベントはありません
        </p>
      )}

      {/* スロット追加ボタン */}
      <Link
        href={`/venue/slots/new?date=${date}`}
        className="mt-3 block w-full py-2 text-center text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
      >
        + この日にスロットを追加
      </Link>
    </div>
  );
}
