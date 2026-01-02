// app/venue/events/[eventId]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client.legacy";

type EventStatus = "open" | "pending" | "draft" | "matched" | "cancelled";

type EventRow = {
  id: string;
  venue_id: string;
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  max_artists: number | null;
  status: EventStatus;
  created_at: string;
};

export default function EventEditPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // フォーム用 state
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxArtists, setMaxArtists] = useState<string>("");
  const [status, setStatus] = useState<EventStatus>("open");

  // 初期読み込み
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
        const { data, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();

        if (eventsError) throw eventsError;
        if (!data) {
          setError("イベントが見つかりませんでした。");
          return;
        }

        const e = data as EventRow;
        setEvent(e);

        setTitle(e.title);
        setEventDate(e.event_date);
        setStartTime(e.start_time.slice(0, 5));
        setEndTime(e.end_time.slice(0, 5));
        setMaxArtists(
          e.max_artists != null ? String(e.max_artists) : "",
        );
        setStatus(e.status);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "イベントの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !eventId) return;

    if (!title.trim()) {
      setError("タイトルは必須です。");
      return;
    }
    if (!eventDate) {
      setError("日付は必須です。");
      return;
    }
    if (!startTime || !endTime) {
      setError("開始時刻と終了時刻を入力してください。");
      return;
    }

    const parsedMax =
      maxArtists.trim() === "" ? null : Number(maxArtists.trim());

    if (parsedMax !== null && (Number.isNaN(parsedMax) || parsedMax < 1)) {
      setError("最大組数は1以上の数値で入力してください。");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("events")
        .update({
          title: title.trim(),
          event_date: eventDate,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          max_artists: parsedMax,
          status,
        })
        .eq("id", eventId);

      if (updateError) throw updateError;

      router.push(`/venue/events/${eventId}`);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  // ===== UI =====

  if (loading) {
    return (
      <main className="p-4">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="p-4">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p className="text-sm text-red-500">
            イベント情報が取得できませんでした。
          </p>
        )}
        <Link
          href="/venue/events"
          className="mt-3 inline-flex text-xs text-blue-600 underline"
        >
          イベント一覧に戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-1">イベントを編集</h1>
          <p className="text-xs text-gray-600">
            タイトル・開催日時・最大組数（act枠）・ステータスを変更できます。
          </p>
        </div>
        <Link
          href={`/venue/events/${eventId}`}
          className="text-xs text-blue-600 underline"
        >
          詳細に戻る
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 border rounded p-4 bg-white shadow-sm"
      >
        <div className="space-y-2">
          <label className="block text-sm">
            タイトル
            <input
              type="text"
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-sm">
              開催日
              <input
                type="date"
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </label>

            <label className="block text-sm">
              開始時間
              <input
                type="time"
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>

            <label className="block text-sm">
              終了時間
              <input
                type="time"
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>

          <label className="block text-sm">
            最大組数（act枠）
            <input
              type="number"
              min={1}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={maxArtists}
              onChange={(e) => setMaxArtists(e.target.value)}
              placeholder="空欄で上限なし"
            />
            <span className="text-[11px] text-gray-500">
              空欄の場合、上限なし（∞）として扱われます。
            </span>
          </label>

          <label className="block text-sm">
            ステータス
            <select
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus)}
            >
              <option value="draft">draft（準備中）</option>
              <option value="open">open（募集中）</option>
              <option value="pending">pending（調整中）</option>
              <option value="matched">matched（確定）</option>
              <option value="cancelled">cancelled（中止）</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link
            href={`/venue/events/${eventId}`}
            className="px-3 py-1.5 border rounded text-xs"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded bg-blue-600 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </form>
    </main>
  );
}
