// app/musician/organized-events/page.tsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { EventRow, EventWithVenue, EventActRow } from "@/lib/utils/events";
type EventWithCount = EventRow & {
  acceptedCount: number;
};

type Props = {
  userId: string;
  events: EventWithVenue[];
  eventActs: EventActRow[];
}
export default function MusicianOrganizedEventsPage({ userId, events, eventActs }:Props) {
  const eventIds = events.map((e) => e.id);

  // 2. event_acts から acceptedCount を集計
  const countMap = new Map<string, number>();
  // console.log("event acts: " + JSON.stringify(eventActs));
  eventIds.map(id => {
    countMap.set(
      id as string,
      eventActs.filter(ea => ea.status==="accepted" && ea.event_id === id).length ?? 0 ,
    ); });
  // console.log(countMap);

  const withCount: EventWithCount[] = events.map((e) => ({
    ...e,
    acceptedCount: countMap.get(e.id) ?? 0,
  }));
      
  const totalAccepted = useMemo(
    () => withCount.reduce((sum, e) => sum + e.acceptedCount, 0),
    [events],
  );

  const formatTime = (t: string | null | undefined) =>
    t ? t.slice(0, 5) : "";

  // ===== UI =====
  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-1">自分が企画したイベント</h1>
          <p className="text-sm text-gray-600">
            あなた自身が企画者として立てたイベントの一覧です。
          </p>
        </div>
        <Link
          href="/musician"
          className="text-xs text-blue-600 underline"
        >
          ダッシュボードに戻る
        </Link>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-gray-500">
          まだあなたが企画したイベントはありません。
          「企画管理 → 新しいイベントを企画する」から作成できます。
        </p>
      )}

      {events.length > 0 && (
        <p className="text-[11px] text-gray-500">
          企画イベント数: {events.length} 件 / 決定済み枠合計: {totalAccepted} 組
        </p>
      )}

      <ul className="space-y-2">
        {withCount.map((event) => {
          const openTime = formatTime(event.open_time);
          const startTime = formatTime(event.start_time);
          const endTime = formatTime(event.end_time);

          return (
            <li key={event.id}>
              <Link
                href={`/organizer/events/${event.id}`}
                className="block border rounded p-3 bg-white shadow-sm hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{event.title}</div>

                    {/* {event.venues &&  (
                      <div className="text-[11px] text-gray-500">
                        会場: {event.venues[0].name}
                      </div>
                    )} */}

                    <div className="text-xs text-gray-600">
                      {event.event_date}{" "}
                      {openTime && <>Open {openTime} / </>}
                      {startTime && <>Start {startTime}</>}
                      {endTime && <> 〜 {endTime}</>}
                    </div>

                    <div className="text-[11px] text-gray-500 mt-1">
                      ステータス: {event.status}
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="font-mono text-sm">
                      {event.acceptedCount} / {event.max_artists ?? "∞"}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      決定済み / 最大組数
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
