// app/venue/events/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";;

type EventRow = {
  id: string;
  venue_id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_artists: number | null;
  status: string;
  created_at: string;
  venues?: { id: string; name: string }[]; // ★ 配列にする
};


type EventWithCount = EventRow & {
  acceptedCount: number;
};

export default function VenueEventsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. 全イベント + venues.name を取得
        const { data: eventRows, error: eventsError } = await supabase
          .from("events")
          .select(
            `
            id,
            venue_id,
            title,
            event_date,
            start_time,
            end_time,
            max_artists,
            status,
            created_at,
            venues (
              id,
              name
            )
          `,
          )
          .order("event_date", { ascending: true });

        if (eventsError) throw eventsError;
        if (!eventRows || eventRows.length === 0) {
          setEvents([]);
          return;
        }

        const eventList = eventRows as EventRow[];
        const eventIds = eventList.map((e) => e.id);

        // 2. event_acts から acceptedCount を集計
        const { data: actsRows, error: actsError } = await supabase
          .from("event_acts")
          .select("event_id, status")
          .eq("status", "accepted")
          .in("event_id", eventIds);

        if (actsError) throw actsError;

        const countMap = new Map<string, number>();
        for (const row of actsRows ?? []) {
          countMap.set(
            row.event_id,
            (countMap.get(row.event_id) ?? 0) + 1,
          );
        }

        const withCount: EventWithCount[] = eventList.map((e) => ({
          ...e,
          acceptedCount: countMap.get(e.id) ?? 0,
        }));

        setEvents(withCount);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // ===== UI =====

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-2">イベント一覧</h1>
      <p className="text-sm text-gray-600">
        登録済みのイベント枠と、決定済みの組数を一覧で確認できます。
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && events.length === 0 && (
        <p className="text-sm text-gray-500">まだイベントがありません。</p>
      )}

      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/venue/events/${event.id}`}
              className="block border rounded p-3 bg-white shadow-sm hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{event.title}</div>

                  {event.venues && event.venues.length > 0 && (
                    <div className="text-[11px] text-gray-500">
                      会場: {event.venues[0].name}
                    </div>
                  )}

                  <div className="text-xs text-gray-600">
                    {event.event_date} {event.start_time.slice(0, 5)} 〜{" "}
                    {event.end_time.slice(0, 5)}
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
        ))}
      </ul>
    </main>
  );
}
