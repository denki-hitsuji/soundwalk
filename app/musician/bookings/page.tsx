// app/musician/bookings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client.legacy";import { getCurrentUser } from "@/lib/auth/session";
;

type MyAct = {
  id: string;
  name: string;
  act_type: string;
  owner_profile_id: string;
};

type BookingWithDetails = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  act_id: string;
  event_id: string;
  act_name: string;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time: string;
};

export default function MusicianBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [userMissing, setUserMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);

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

        // 1. 自分のActを取得
        const { data: acts, error: actsError } = await supabase
          .from("acts")
          .select("id, name, act_type, owner_profile_id")
          .eq("owner_profile_id", user.id);

        if (actsError) throw actsError;
        if (!acts || acts.length === 0) {
          // Actがまだない → 応募もない
          setBookings([]);
          return;
        }

        const actList = acts as MyAct[];
        const actIds = actList.map((a) => a.id);
        const actMap = new Map(actList.map((a) => [a.id, a]));

        // 2. 自分のActでの応募を取得
        const { data: bookingRows, error: bookingsError } = await supabase
          .from("venue_bookings")
          .select("id, status, message, created_at, event_id, act_id")
          .in("act_id", actIds)
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;
        if (!bookingRows || bookingRows.length === 0) {
          setBookings([]);
          return;
        }

        // 3. 関連イベントを取得
        const eventIds = Array.from(
          new Set(bookingRows.map((b) => b.event_id)),
        );

        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("id, title, event_date, start_time, end_time")
          .in("id", eventIds);

        if (eventsError) throw eventsError;

        const eventMap = new Map(
          (events ?? []).map((e) => [e.id, e]),
        );

        // 4. 結合して BookingWithDetails に整形
        const result: BookingWithDetails[] = (bookingRows ?? []).map(
          (b: any) => {
            const event = eventMap.get(b.event_id);
            const act = actMap.get(b.act_id);

            return {
              id: b.id,
              status: b.status,
              message: b.message,
              created_at: b.created_at,
              act_id: b.act_id,
              event_id: b.event_id,
              act_name: act?.name ?? "(不明な名義)",
              event_title: event?.title ?? "(不明なイベント)",
              event_date: event?.event_date ?? "",
              start_time: event?.start_time ?? "",
              end_time: event?.end_time ?? "",
            };
          },
        );

        setBookings(result);
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

  if (userMissing) {
    return (
      <main className="p-4">
        <p className="text-sm text-red-500">ログインが必要です。</p>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-4">自分の応募一覧</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {bookings.length === 0 && !error && (
        <p className="text-sm text-gray-500">まだ応募はありません。</p>
      )}

      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b.id} className="border rounded p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.event_title}</div>
                <div className="text-xs text-gray-600">
                  {b.event_date} {b.start_time.slice(0, 5)} 〜{" "}
                  {b.end_time.slice(0, 5)}
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">
                {b.status}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              名義: <span className="font-medium">{b.act_name}</span>
            </div>

            {b.message && (
              <p className="text-xs text-gray-700 whitespace-pre-wrap">
                {b.message}
              </p>
            )}

            <p className="text-[10px] text-gray-400 mt-1">
              応募日時: {new Date(b.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
