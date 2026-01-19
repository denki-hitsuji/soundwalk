"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/lib/auth/session.client";
import { hasMissingRequired } from "@/lib/forms/required";
import { RequiredLabel } from "../forms/RequiredLabel";

type VenueOption = {
  id: string;
  name: string;
};

/** -------------------------
 * 必須項目定義（ここが唯一の真実）
 * ------------------------ */
const fields = {
  title: { label: "タイトル", required: true },
  venueId: { label: "会場", required: true },
  eventDate: { label: "日付", required: true },
  startTime: { label: "Start", required: true },
  endTime: { label: "End", required: true },
  maxArtists: { label: "最大組数（act枠）", required: true },
  // openTime / charge / conditions は任意
} as const;

type FieldKey = keyof typeof fields;

export default function NewEventPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

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
        setError(e?.message ?? "会場情報の取得に失敗しました。");
      } finally {
        setVenuesLoading(false);
      }
    };

    void loadVenues();
  }, []);

  // ✅ 画面内の“必須不足”判定（表示と disable を同じ情報源で）
  const formValues = useMemo(
    () => ({
      title,
      venueId,
      eventDate,
      startTime,
      endTime,
      maxArtists,
    }),
    [title, venueId, eventDate, startTime, endTime, maxArtists]
  );

  const requiredKeys = useMemo(
    () =>
      (Object.keys(fields) as FieldKey[]).filter((k) => fields[k].required),
    []
  );

  const missingRequired = hasMissingRequired(formValues, requiredKeys);

  // 追加の数値妥当性チェック（ボタン disable にも反映）
  const parsedMax = useMemo(() => {
    const s = maxArtists.trim();
    if (!s) return null;
    const n = Number(s);
    if (Number.isNaN(n)) return null;
    return n;
  }, [maxArtists]);

  const maxInvalid = useMemo(() => {
    if (parsedMax == null) return true; // 必須
    return parsedMax < 1;
  }, [parsedMax]);

  const parsedCharge = useMemo(() => {
    const s = charge.trim();
    if (!s) return null; // 任意
    const n = Number(s);
    if (Number.isNaN(n)) return NaN;
    return n;
  }, [charge]);

  const chargeInvalid = useMemo(() => {
    if (parsedCharge === null) return false; // 任意
    if (Number.isNaN(parsedCharge)) return true;
    return parsedCharge < 0;
  }, [parsedCharge]);

  const canSubmit =
    !!user &&
    !userLoading &&
    !venuesLoading &&
    venues.length > 0 &&
    !saving &&
    !missingRequired &&
    !maxInvalid &&
    !chargeInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("ログインが必要です。");
      return;
    }

    // ✅ ここは UX ではなく最終防衛（disable してても server/DB は信用しない）
    if (!title.trim()) return setError("タイトルは必須です。");
    if (!eventDate) return setError("日付は必須です。");
    if (!startTime || !endTime) return setError("Start と End の時間を入力してください。");
    if (!venueId) return setError("会場を選択してください。");
    if (maxInvalid) return setError("最大組数は1以上の数値で入力してください。");
    if (chargeInvalid) return setError("料金は0以上の数値で入力してください。");

    setSaving(true);

    try {
      const { data, error: insertError } = await supabase
        .from("events")
        .insert({
          title: title.trim(),
          venue_id: venueId,
          event_date: eventDate,
          open_time: openTime ? openTime + ":00" : null,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          max_artists: parsedMax, // nullにはならない想定（ガード済み）
          charge: parsedCharge === null ? null : parsedCharge,
          conditions: conditions.trim() || null,
          status: "open",
          organizer_profile_id: user.id,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const newId = data?.id as string;

      // ✅ typo 修正: eventss -> events
      router.push(`/organizer/events/${newId}`);
      // ✅ refresh は競合しやすいので基本しない
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "イベントの作成に失敗しました。");
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
        <Link href="/organizer/events" className="text-xs text-blue-600 underline">
          企画一覧へ戻る
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {userLoading && <p className="text-sm text-gray-500">認証情報を読み込み中...</p>}
      {venuesLoading && <p className="text-sm text-gray-500">会場情報を読み込み中...</p>}

      {!venuesLoading && venues.length === 0 && (
        <p className="text-sm text-gray-500">
          会場がまだ登録されていません。開発側または店舗オーナーに登録してもらってください。
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border rounded bg-white shadow-sm p-4">
        <label className="block text-sm">
          <RequiredLabel label={fields.title.label} required />
          <input
            type="text"
            className="mt-1 w-full border rounded px-2 py-1 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 〇〇ナイト / アコースティックセッション など"
          />
        </label>

        <label className="block text-sm">
          <RequiredLabel label={fields.venueId.label} required />
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
            <RequiredLabel label={fields.eventDate.label} required />
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
            <RequiredLabel label={fields.startTime.label} required />
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
            <RequiredLabel label={fields.endTime.label} required />
            <input
              type="time"
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <RequiredLabel label={fields.maxArtists.label} required />
            <input
              type="number"
              min={1}
              className="mt-1 w-full border rounded px-2 py-1 text-sm"
              value={maxArtists}
              onChange={(e) => setMaxArtists(e.target.value)}
              placeholder="例: 5"
            />
            {maxInvalid && maxArtists.trim() !== "" && (
              <div className="mt-1 text-xs text-red-600">1以上で入力してください</div>
            )}
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
          {chargeInvalid && charge.trim() !== "" && (
            <div className="mt-1 text-xs text-red-600">0以上の数値で入力してください</div>
          )}
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

        {!canSubmit && (
          <div className="text-xs text-gray-600">
            {missingRequired ? (
              <span className="text-red-600">※ 必須項目を入力してください</span>
            ) : maxInvalid ? (
              <span className="text-red-600">※ 最大組数は1以上で入力してください</span>
            ) : chargeInvalid ? (
              <span className="text-red-600">※ 料金は0以上で入力してください</span>
            ) : venues.length === 0 ? (
              <span>会場が未登録のため作成できません</span>
            ) : !user ? (
              <span>ログインが必要です</span>
            ) : null}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Link href="/organizer/events" className="px-3 py-1.5 border rounded text-xs">
            キャンセル
          </Link>

          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-1.5 rounded bg-purple-600 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? "作成中..." : "イベントを作成する"}
          </button>
        </div>
      </form>
    </main>
  );
}
