// app/venue/events/[eventId]/BookingApprovalList.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client.legacy";;

type Props = {
  eventId: string;
};

type BookingRow = {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  event_id: string;
  act_id: string;
  act_name: string;
  act_type: string;
};

export function BookingApprovalList({ eventId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  // ★ max_artists をイベントから取得して保持
  const [maxArtists, setMaxArtists] = useState<number | null>(null);

  // 応募一覧を読み込み
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // 0. イベントから max_artists を取得
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("id, max_artists")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      setMaxArtists(eventRow?.max_artists ?? null);

      // 1. このイベントの booking を取得
      const { data: bookingRows, error: bookingsError } = await supabase
        .from("venue_bookings")
        .select("id, status, message, created_at, event_id, act_id")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookingRows || bookingRows.length === 0) {
        setBookings([]);
        return;
      }

      const actIds = Array.from(
        new Set(bookingRows.map((b) => b.act_id)),
      ) as string[];

      // 2. 対応する acts を取得
      const { data: acts, error: actsError } = await supabase
        .from("acts")
        .select("id, name, act_type")
        .in("id", actIds);

      if (actsError) throw actsError;

      const actMap = new Map(
        (acts ?? []).map((a) => [a.id, a]),
      );

      // 3. 結合して BookingRow に整形
      const result: BookingRow[] = (bookingRows ?? []).map((b: any) => {
        const act = actMap.get(b.act_id);
        return {
          id: b.id,
          status: b.status,
          message: b.message,
          created_at: b.created_at,
          event_id: b.event_id,
          act_id: b.act_id,
          act_name: act?.name ?? "(不明な名義)",
          act_type: act?.act_type ?? "",
        };
      });

      setBookings(result);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "応募一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [eventId]);

  // ★ 現在の acceptedCount を bookings から計算
  const acceptedCount = useMemo(
    () => bookings.filter((b) => b.status === "accepted").length,
    [bookings],
  );

  // ★ 枠が埋まっているかどうか
  const isFull =
    maxArtists != null && acceptedCount >= maxArtists;

  // 承認
   const handleApprove = async (booking: BookingRow) => {
    setError(null);

    // ★ 枠制限チェック
    if (maxArtists != null && acceptedCount >= maxArtists) {
      setError(
        `最大組数(${maxArtists}組)に達しているため、これ以上承認できません。`,
      );
      return;
    }

    setMutatingId(booking.id);
    try {
      // 1. venue_bookings を accepted に
      const { error: bookingError } = await supabase
        .from("venue_bookings")
        .update({ status: "accepted" })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // 2. event_acts に accepted を upsert
      const { error: eaError } = await supabase
        .from("event_acts")
        .upsert(
          {
            event_id: booking.event_id,
            act_id: booking.act_id,
            status: "accepted",
          },
          { onConflict: "event_id,act_id" },
        );

      if (eaError) throw eaError;

      // 3. ★ 上限に達したら events.status を matched に更新
      if (maxArtists != null) {
        const newAcceptedCount =
          acceptedCount + (booking.status === "accepted" ? 0 : 1);

        if (newAcceptedCount >= maxArtists) {
          const { error: statusError } = await supabase
            .from("events")
            .update({ status: "matched" })
            .eq("id", booking.event_id);

          if (statusError) throw statusError;
        }
      }

      await load();
      router.refresh(); // 上部のステータス表示と acceptedCount / max も更新
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "承認に失敗しました。");
    } finally {
      setMutatingId(null);
    }
  };

  // 拒否
  const handleReject = async (booking: BookingRow) => {
    setMutatingId(booking.id);
    setError(null);
    try {
      // 1. venue_bookings を rejected に
      const { error: bookingError } = await supabase
        .from("venue_bookings")
        .update({ status: "rejected" })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // 2. event_acts に存在していれば削除
      const { error: eaError } = await supabase
        .from("event_acts")
        .delete()
        .eq("event_id", booking.event_id)
        .eq("act_id", booking.act_id);

      if (eaError) throw eaError;

      await load();
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "拒否に失敗しました。");
    } finally {
      setMutatingId(null);
    }
  };

  // ===== UI =====

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">応募一覧（承認 / 拒否）</h2>
        {maxArtists != null && (
          <div className="text-xs text-gray-600">
            決定済み:{" "}
            <span className="font-mono">
              {acceptedCount} / {maxArtists}
            </span>
          </div>
        )}
      </div>

      {loading && (
        <p className="text-sm text-gray-500">読み込み中...</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && bookings.length === 0 && !error && (
        <p className="text-sm text-gray-500">
          この枠への応募はまだありません。
        </p>
      )}

      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b.id} className="border rounded p-3 space-y-1 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.act_name}</div>
                <div className="text-xs text-gray-500">{b.act_type}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">
                {b.status}
              </span>
            </div>

            {b.message && (
              <p className="text-xs text-gray-700 whitespace-pre-wrap mt-1">
                「{b.message}」
              </p>
            )}

            <p className="text-[10px] text-gray-400 mt-1">
              応募日時: {new Date(b.created_at).toLocaleString()}
            </p>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => handleApprove(b)}
                disabled={
                  mutatingId === b.id ||
                  (isFull && b.status !== "accepted") // ★ 枠が埋まっていたら新規承認を禁止
                }
                className="px-3 py-1 rounded text-xs font-semibold border border-emerald-600 text-emerald-700 disabled:opacity-50"
              >
                {mutatingId === b.id && b.status !== "accepted"
                  ? "処理中..."
                  : "承認する"}
              </button>
              <button
                type="button"
                onClick={() => handleReject(b)}
                disabled={mutatingId === b.id}
                className="px-3 py-1 rounded text-xs font-semibold border border-rose-600 text-rose-700 disabled:opacity-50"
              >
                {mutatingId === b.id && b.status !== "rejected"
                  ? "処理中..."
                  : "拒否する"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
