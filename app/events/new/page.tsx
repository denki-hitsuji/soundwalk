// app/events/new/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase  } from "@/lib/supabase/client";;
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth/session.client";

type VenueOption = {
  id: string;
  name: string;
};

export default function NewEventPage() {
  const router = useRouter();

  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [venueId, setVenueId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [openTime, setOpenTime] = useState(""); // optional
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxArtists, setMaxArtists] = useState<string>("");
  const [charge, setCharge] = useState<string>("");
  const [conditions, setConditions] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // venues 読み込み
  useEffect(() => {
    const loadVenues = async () => {
      setVenuesLoading(true);
      setError(null);
      try {
        const { data, error: vError } = await supabase
          .from("venues")
          .select("id, name")
          .order("name", { ascending: true });

        if (vError) throw vError;
        setVenues((data ?? []) as VenueOption[]);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "会場情報の取得に失敗しました。");
      } finally {
        setVenuesLoading(false);
      }
    };

    void loadVenues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const user = await useCurrentUser();
      if (!user) {
        setError("ログインが必要です。");
        return;
      }

      if (!title.trim()) {
        setError("タイトルは必須です。");
        return;
      }
      if (!eventDate) {
        setError("日付は必須です。");
        return;
      }
      if (!startTime || !endTime) {
        setError("Start と End の時間を入力してください。");
        return;
      }
      if (!venueId) {
        setError("会場を選択してください。");
        return;
      }

      const parsedMax =
        maxArtists.trim() === "" ? null : Number(maxArtists.trim());
      if (
        parsedMax !== null &&
        (Number.isNaN(parsedMax) || parsedMax < 1)
      ) {
        setError("最大組数は1以上の数値で入力してください。");
        return;
      }

      const parsedCharge =
        charge.trim() === "" ? null : Number(charge.trim());
      if (
        parsedCharge !== null &&
        (Number.isNaN(parsedCharge) || parsedCharge < 0)
      ) {
        setError("料金は0以上の数値で入力してください。");
        return;
      }

      setSaving(true);

      const { data, error: insertError } = await supabase
        .from("events")
        .insert({
          title: title.trim(),
          venue_id: venueId,
          event_date: eventDate,
          open_time: openTime ? openTime + ":00" : null,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          max_artists: parsedMax,
          charge: parsedCharge,
          conditions: conditions.trim() || null,
          status: "open", // まずは募集中として作る
          organizer_profile_id: user?.user?.id,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const newId = data?.id as string;
      // 自分が企画したイベントの詳細へ
      router.push(`/musician/organized-events/${newId}`);
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "イベントの作成に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-1">新しいイベントを企画する</h1>
          <p className="text-sm text-gray-600">
            会場・日付・時間・料金・条件を入力して、イベントの企画を作成します。
          </p>
        </div>
        <Link
          href="/musician"
          className="text-xs text-blue-600 underline"
        >
          ダッシュボードへ戻る
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {venuesLoading && (
        <p className="text-sm text-gray-500">会場情報を読み込み中...</p>
      )}

      {!venuesLoading && venues.length === 0 && (
        <p className="text-sm text-gray-500">
          会場がまだ登録されていません。開発側または店舗オーナーに登録してもらってください。
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 border rounded bg-white shadow-sm p-4"
      >
        <label className="block text-sm">
          タイトル
          <input
            type="text"
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 〇〇ナイト / アコースティックセッション など"
          />
        </label>

        <label className="block text-sm">
          会場
          <select
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
          >
            <option value="">会場を選択してください</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="block text-sm">
            日付
            <input
              type="date"
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            Open（任意）
            <input
              type="time"
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            Start
            <input
              type="time"
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-sm">
            End
            <input
              type="time"
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>

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
          </label>
        </div>

        <label className="block text-sm">
          料金（チャージ）
          <input
            type="number"
            min={0}
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={charge}
            onChange={(e) => setCharge(e.target.value)}
            placeholder="例: 2500（単位：円）"
          />
        </label>

        <label className="block text-sm">
          条件（1ドリンク・投げ銭制など）
          <textarea
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            rows={2}
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="例: 1ドリンク別 / 投げ銭制 / 学生割引あり など"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Link
            href="/musician"
            className="px-3 py-1.5 border rounded text-xs"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={saving || venues.length === 0}
            className="px-4 py-1.5 rounded bg-purple-600 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? "作成中..." : "イベントを作成する"}
          </button>
        </div>
      </form>
    </main>
  );
}
