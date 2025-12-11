// app/musician/organized-events/[eventId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, getCurrentUser } from "@/lib/supabaseClient";

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
  charge: number | null;
  conditions: string | null;
  created_at: string;
  venues?: { id: string; name: string }[];
};

type ActRow = {
  id: string;
  name: string;
  act_type: string;
};

export default function MusicianOrganizedEventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params?.eventId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [userMissing, setUserMissing] = useState(false);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [acts, setActs] = useState<ActRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // acceptedCount は acts（accepted のみ）から計算
  const acceptedCount = useMemo(() => acts.length, [acts]);

  useEffect(() => {
    const load = async () => {
      if (!eventId) {
        setError("eventId が指定されていません。");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const user = await getCurrentUser();
        if (!user) {
          setUserMissing(true);
          return;
        }

        // 1. 自分が企画したイベントかつ指定IDのものを取得
        const { data: eventRow, error: eventError } = await supabase
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
            charge,
            conditions,
            created_at,
            venues (
              id,
              name
            )
          `,
          )
          .eq("id", eventId)
          .eq("organizer_profile_id", user.id)
          .single();

        if (eventError) throw eventError;
        if (!eventRow) {
          setError("このイベントは見つからないか、あなたの企画ではありません。");
          return;
        }

        const e = eventRow as EventRow;
        setEvent(e);

        // 2. event_acts から accepted の出演名義を取得
        const { data: eaRows, error: eaError } = await supabase
          .from("event_acts")
          .select(
            `
            act_id,
            status,
            acts (
              id,
              name,
              act_type
            )
          `,
          )
          .eq("event_id", eventId)
          .eq("status", "accepted");

        if (eaError) throw eaError;

        const actList: ActRow[] =
          (eaRows ?? []).map((row: any) => ({
            id: row.acts?.id ?? row.act_id,
            name: row.acts?.name ?? "(不明な名義)",
            act_type: row.acts?.act_type ?? "",
          })) ?? [];

        setActs(actList);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "イベント情報の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [eventId]);

  const formatTime = (t: string | null | undefined) => {
    if (!t) return null;
    // "HH:MM:SS" -> "HH:MM"
    return t.slice(0, 5);
  };

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

  if (!event) {
    return (
      <main className="p-4 space-y-3">
        <p className="text-sm text-red-500">
          {error ?? "イベントが見つかりませんでした。"}
        </p>
        <Link
          href="/musician/organized-events"
          className="inline-flex text-xs text-blue-600 underline"
        >
          自分が企画したイベント一覧に戻る
        </Link>
      </main>
    );
  }

  const openTime = formatTime(event.open_time);
  const startTime = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);

  return (
    <main className="p-4 space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-1">{event.title}</h1>
          <p className="text-sm text-gray-600">
            {event.event_date}{" "}
            {openTime && (
              <>
                Open {openTime}
                {" / "}
              </>
            )}
            {startTime && <>Start {startTime}</>}
            {endTime && <> 〜 {endTime}</>}
          </p>

          {event.venues && event.venues.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              会場: <span className="font-semibold">{event.venues[0].name}</span>
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            ステータス: <span className="font-mono">{event.status}</span>{" "}
            {event.max_artists != null && (
              <>
                / 決定済み{" "}
                <span className="font-mono">
                  {acceptedCount} / {event.max_artists}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link
            href="/musician/organized-events"
            className="text-xs text-blue-600 underline"
          >
            一覧に戻る
          </Link>

          {/* 将来ここに「コピーして新規作成」「公開ページを見る」などを足す */}
          {/* <button className="px-3 py-1.5 rounded bg-emerald-600 text-xs font-semibold text-white">
            この企画をコピーする
          </button> */}
        </div>
      </div>

      {/* 基本情報カード */}
      <section className="border rounded bg-white shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-1">基本情報</h2>

        <div className="text-xs text-gray-700 space-y-1">
          <div>
            <span className="font-semibold">日程: </span>
            <span>{event.event_date}</span>
          </div>

          <div>
            <span className="font-semibold">時間: </span>
            <span>
              {openTime && <>Open {openTime} / </>}
              {startTime && <>Start {startTime}</>}
              {endTime && <> 〜 {endTime}</>}
            </span>
          </div>

          {event.charge != null && (
            <div>
              <span className="font-semibold">料金: </span>
              <span>¥{event.charge.toLocaleString()}</span>
            </div>
          )}

          {event.conditions && (
            <div>
              <span className="font-semibold">条件: </span>
              <span>{event.conditions}</span>
            </div>
          )}
        </div>
      </section>

      {/* 出演名義（確定済み） */}
      <section className="border rounded bg-white shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-1">出演名義（確定済み）</h2>

        {acts.length === 0 && (
          <p className="text-sm text-gray-500">
            まだ確定している出演者はいません。
          </p>
        )}

        <ul className="space-y-1">
          {acts.map((act) => (
            <li
              key={act.id}
              className="flex items-center justify-between border rounded px-2 py-1"
            >
              <div>
                <div className="font-medium text-sm">{act.name}</div>
                <div className="text-[11px] text-gray-500">{act.act_type}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 今後ここに:
          - フライヤー生成
          - 公開ページへのリンク
          - この企画から別日イベントをコピー
        などを足していける */}
    </main>
  );
}
