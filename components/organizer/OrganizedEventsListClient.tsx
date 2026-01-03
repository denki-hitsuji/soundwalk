// app/musician/organized-events/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client.legacy";
import { getCurrentUser } from "@/lib/auth/session";

type EventStatus = "open" | "pending" | "draft" | "matched" | "cancelled";

type EventRow = {
  id: string;
  venue_id: string;
  title: string;
  event_date: string;
  open_time: string | null;
  start_time: string;
  end_time: string;
  max_artists: number | null;
  status: EventStatus;
  created_at: string;
  venues?: { id: string; name: string }[];
};

type EventWithCount = EventRow & {
  acceptedCount: number;
};

export default function MusicianOrganizedEventsPage() {
  const [loading, setLoading] = useState(true);
  const [userMissing, setUserMissing] = useState(false);
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setUserMissing(true);
          return;
        }

        // 1. 自分が企画したイベントを取得
        const { data: eventRows, error: eventsError } = await supabase
          .from("events")
          .select(
            `
            id,
            venue_id,
            title,
            event_date,
            open_time,
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
          .eq("organizer_profile_id", user.id)
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true });

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
            row.event_id as string,
            (countMap.get(row.event_id as string) ?? 0) + 1,
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

  const totalAccepted = useMemo(
    () => events.reduce((sum, e) => sum + e.acceptedCount, 0),
    [events],
  );

  const formatTime = (t: string | null | undefined) =>
    t ? t.slice(0, 5) : "";

  // ===== UI =====

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (userMissing) {
    return (
      <main className="p-4">
        <p className="text-sm text-red-500">ログインが必要です。</p>
      </main>
    );
  }

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

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!error && events.length === 0 && (
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
        {events.map((event) => {
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

                    {event.venues && event.venues.length > 0 && (
                      <div className="text-[11px] text-gray-500">
                        会場: {event.venues[0].name}
                      </div>
                    )}

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
