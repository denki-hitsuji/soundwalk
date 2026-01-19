"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { updateEvent, updateEventStatus } from "@/lib/api/eventsAction";
import type { EventRow } from "@/lib/utils/events";
import type { VenueRow } from "@/lib/utils/venues";

// ✅ 共通部品（あなたが切り出す前提）
import { RequiredLabel } from "@/components/forms/RequiredLabel";
import { hasMissingRequired } from "@/lib/forms/required";

type Props = {
  userId: string;
  event: EventRow;
  allVenues: VenueRow[];
};

/** -------------------------
 * 必須項目定義（ここが唯一の真実）
 * ------------------------ */
const fields = {
  title: { label: "タイトル", required: true },
  venueId: { label: "会場", required: true },
  eventDate: { label: "日程", required: true },

  openTime: { label: "Open", required: true },   // ★ 必須に変更
  startTime: { label: "Start", required: true }, // ★ 必須に変更
  endTime: { label: "End", required: false },    // 任意のまま

  maxArtists: { label: "最大組数", required: false },
  charge: { label: "チャージ", required: false },
  conditions: { label: "条件", required: false },
} as const;


type FieldKey = keyof typeof fields;

export default function OrganizedEventEditClient({ userId, event, allVenues }: Props) {
  const router = useRouter();
  const eventId = event.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [venueId, setVenueId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [openTime, setOpenTime] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [maxArtists, setMaxArtists] = useState<string>("");
  const [charge, setCharge] = useState<string>("");
  const [conditions, setConditions] = useState("");

  // init（props由来なので1回でOK）
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      if (event.organizer_profile_id !== userId) {
        throw new Error("このイベントはあなたの企画ではありません。");
      }

      setTitle(event.title ?? "");
      setVenueId(event.venue_id ?? "");
      setEventDate(event.event_date ?? "");
      setOpenTime(event.open_time ? event.open_time.slice(0, 5) : "");
      setStartTime(event.start_time ? event.start_time.slice(0, 5) : "");
      setEndTime(event.end_time ? event.end_time.slice(0, 5) : "");
      setMaxArtists(event.max_artists == null ? "" : String(event.max_artists));
      setCharge(event.charge == null ? "" : String(event.charge));
      setConditions(event.conditions ?? "");
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
    // eventId が変わる画面ではないので deps はこれでOK
  }, [eventId, event.organizer_profile_id, userId]);

  // ✅ 必須不足判定（fields定義を唯一の情報源に）
  const formValues = useMemo(
    () => ({
      title,
      venueId,
      eventDate,
      openTime,
      startTime,
      endTime,
      maxArtists,
      charge,
      conditions,
    }),
    [title, venueId, eventDate, openTime, startTime, endTime, maxArtists, charge, conditions]
  );

  const requiredKeys = useMemo(
    () => (Object.keys(fields) as FieldKey[]).filter((k) => fields[k].required),
    []
  );

  const missingRequired = hasMissingRequired(formValues, requiredKeys);

  // 数値妥当性（任意欄だが、入力された場合は正しい値にする）
  const parsedMaxArtists = useMemo(() => {
    const s = maxArtists.trim();
    if (!s) return null;
    const n = Number(s);
    if (Number.isNaN(n)) return NaN;
    return n;
  }, [maxArtists]);

  const maxArtistsInvalid = useMemo(() => {
    if (parsedMaxArtists === null) return false; // 任意
    if (Number.isNaN(parsedMaxArtists)) return true;
    return parsedMaxArtists < 0;
  }, [parsedMaxArtists]);

  const parsedCharge = useMemo(() => {
    const s = charge.trim();
    if (!s) return null;
    const n = Number(s);
    if (Number.isNaN(n)) return NaN;
    return n;
  }, [charge]);

  const chargeInvalid = useMemo(() => {
    if (parsedCharge === null) return false; // 任意
    if (Number.isNaN(parsedCharge)) return true;
    return parsedCharge < 0;
  }, [parsedCharge]);

  const canSave = useMemo(() => {
    if (!event) return false;
    if (saving || canceling) return false;
    if (missingRequired) return false;
    if (maxArtistsInvalid || chargeInvalid) return false;
    return true;
  }, [event, saving, canceling, missingRequired, maxArtistsInvalid, chargeInvalid]);

  const save = async () => {
    if (!event) return;
    if (!canSave) return;
    if (!openTime || !startTime) {
      setError("Open と Start は必須です。");
      return;
    }
    const ok = window.confirm("基本情報を保存しますか？");
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        venue_id: venueId,
        event_date: eventDate,
        open_time: openTime ? openTime : null,
        start_time: startTime ? startTime : null,
        end_time: endTime ? endTime : null,
        max_artists: parsedMaxArtists === null ? null : parsedMaxArtists,
        charge: parsedCharge === null ? null : parsedCharge,
        conditions: conditions.trim() ? conditions.trim() : null,
      };

      await updateEvent(eventId, payload);

      alert("保存しました。");
      // ✅ refresh で再現しづらい不安定が出がち。ここは戻る遷移に寄せる方が安全。
      router.push(`/organizer/events/${eventId}`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const cancelEvent = async () => {
    if (!event) return;

    const ok = window.confirm(
      "この企画を中止（cancelled）にしますか？\n※参加者がいる場合は別途連絡が必要です。"
    );
    if (!ok) return;

    setCanceling(true);
    setError(null);

    try {
      await updateEventStatus({ eventId, status: "cancelled" });
      alert("中止にしました。");

      // ✅ organizer → musician に揃える（あなたのルーティング方針に合わせる）
      router.push(`/organizer/events/${eventId}`);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "中止に失敗しました。");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) return <main className="text-sm text-gray-500">読み込み中…</main>;

  if (!event) {
    return (
      <main className="space-y-2">
        <p className="text-sm text-red-600">{error ?? "イベントが見つかりませんでした。"}</p>
        <Link href="/organizer/events" className="text-sm text-blue-700 underline">
          一覧へ
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-4 max-w-3xl">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">企画編集</div>
          <h1 className="text-xl font-bold truncate">{event.title}</h1>
          <div className="text-[11px] text-gray-500 mt-1">
            status: <span className="font-mono">{event.status}</span>
          </div>
        </div>

        <Link
          href={`/organizer/events/${eventId}`}
          className="text-xs text-blue-700 underline underline-offset-2"
        >
          詳細へ戻る
        </Link>
      </header>

      {error && <div className="rounded border bg-white p-3 text-sm text-red-600">{error}</div>}

      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold">基本情報</h2>

        <label className="block text-sm">
          <RequiredLabel label={fields.title.label} required={fields.title.required} />
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <RequiredLabel label={fields.venueId.label} required={fields.venueId.required} />
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
            >
              <option value="">選択してください</option>
              {allVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <RequiredLabel label={fields.eventDate.label} required={fields.eventDate.required} />
            <input
              type="date"
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm">
  <RequiredLabel label={fields.openTime.label} required={fields.openTime.required} />
  <input
    type="time"
    className="mt-1 w-full rounded border px-3 py-2 text-sm"
    value={openTime}
    onChange={(e) => setOpenTime(e.target.value)}
  />
</label>

<label className="block text-sm">
  <RequiredLabel label={fields.startTime.label} required={fields.startTime.required} />
  <input
    type="time"
    className="mt-1 w-full rounded border px-3 py-2 text-sm"
    value={startTime}
    onChange={(e) => setStartTime(e.target.value)}
  />
</label>

<label className="block text-sm">
  <RequiredLabel label={fields.endTime.label} required={fields.endTime.required} />
  <input
    type="time"
    className="mt-1 w-full rounded border px-3 py-2 text-sm"
    value={endTime}
    onChange={(e) => setEndTime(e.target.value)}
  />
</label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            最大組数（任意）
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={maxArtists}
              onChange={(e) => setMaxArtists(e.target.value)}
            />
            {maxArtistsInvalid && maxArtists.trim() !== "" && (
              <div className="mt-1 text-xs text-red-600">0以上の数値で入力してください</div>
            )}
          </label>

          <label className="block text-sm">
            チャージ（円・任意）
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
            />
            {chargeInvalid && charge.trim() !== "" && (
              <div className="mt-1 text-xs text-red-600">0以上の数値で入力してください</div>
            )}
          </label>
        </div>

        <label className="block text-sm">
          条件（任意）
          <textarea
            className="mt-1 w-full rounded border px-3 py-2 text-sm min-h-[80px]"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
          />
        </label>

        {!canSave && (
          <div className="text-xs text-gray-600">
            {missingRequired ? (
              <span className="text-red-600">※ 必須項目を入力してください</span>
            ) : maxArtistsInvalid ? (
              <span className="text-red-600">※ 最大組数は0以上で入力してください</span>
            ) : chargeInvalid ? (
              <span className="text-red-600">※ チャージは0以上で入力してください</span>
            ) : null}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded bg-gray-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-rose-700">中止</h2>
        <p className="text-xs text-gray-600">
          企画を中止（cancelled）にします。出演者がいる場合の連絡は運用で行ってください（後で通知/RPC化できます）。
        </p>

        <button
          type="button"
          onClick={cancelEvent}
          disabled={canceling || event.status === "cancelled"}
          className="rounded border border-rose-600 px-4 py-2 text-xs font-semibold text-rose-700 disabled:opacity-40"
        >
          {event.status === "cancelled" ? "中止済み" : canceling ? "処理中…" : "この企画を中止する"}
        </button>
      </section>
    </main>
  );
}
