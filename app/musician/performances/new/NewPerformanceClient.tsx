"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toYmdLocal } from "@/lib/utils/date";
import { upsertPerformance } from "@/lib/api/performancesAction";
import { ActRow } from "@/lib/utils/acts";
import { hasMissingRequired } from "@/lib/forms/required";
import { RequiredLabel } from "@/components/forms/RequiredLabel";

/** -------------------------
 * 必須項目定義（ここが唯一の真実）
 * ------------------------ */
const fields = {
  event_date: { label: "日付", required: true },
  act_id: { label: "出演名義", required: true },
  venue_name: { label: "会場", required: false },
  memo: { label: "メモ", required: false },
} as const;

type FieldKey = keyof typeof fields;

type Props = {
  userId: string | null;
  myActs: ActRow[];
};

export default function NewPerformanceClient({ userId, myActs }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  // 初期値（クイックバー対応）
  const [eventDate, setEventDate] = useState(sp.get("date") ?? toYmdLocal());
  const [actId, setActId] = useState(sp.get("actId") ?? "");
  const [venueName, setVenueName] = useState(sp.get("venue") ?? "");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const noActs = myActs.length === 0;

  // actId が空なら先頭を自動選択
  // useEffect(() => {
  //   if (!actId && myActs.length > 0) {
  //     setActId(myActs[0].id);
  //   }
  // }, [actId, myActs]);

  const formValues = useMemo(
    () => ({
      event_date: eventDate,
      act_id: actId,
      venue_name: venueName,
      memo,
    }),
    [eventDate, actId, venueName, memo]
  );

  const requiredKeys = useMemo(
    () =>
      (Object.keys(fields) as FieldKey[]).filter(
        (k) => fields[k].required
      ),
    []
  );

  const missingRequired = hasMissingRequired(formValues, requiredKeys);

  const handleSave = async () => {
    if (!userId) {
      alert("ログイン情報を取得できませんでした。");
      return;
    }

    setSaving(true);
    try {
      await upsertPerformance({
        id: null,
        profile_id: userId,
        act_id: actId,
        event_date: eventDate,
        venue_name: venueName || null,
        memo: memo || null,
      });
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。");
      setSaving(false);
      return;
    }

    router.push("/musician/performances");
  };

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">新しいライブの記録</h1>

      <div className="space-y-3 max-w-md">
        {/* 日付 */}
        <label className="block">
          <span className="text-sm font-medium">
            <RequiredLabel
              label={fields.event_date.label}
              required={fields.event_date.required}
            />
          </span>
          <input
            type="date"
            className="mt-1 border rounded px-2 py-1 w-full"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </label>

        {/* 出演名義 */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              <RequiredLabel
                label={fields.act_id.label}
                required={fields.act_id.required}
              />
            </span>
            <Link
              href="/musician/acts"
              className="text-[11px] text-blue-600 hover:underline"
            >
              出演名義を編集する
            </Link>
          </div>

          {noActs ? (
            <div className="mt-1 text-xs text-red-500 space-y-1">
              <p>まだ出演名義が登録されていません。</p>
              <p>
                まずは{" "}
                <Link href="/musician/acts" className="text-blue-600 underline">
                  出演名義
                </Link>{" "}
                を作成してください。
              </p>
            </div>
          ) : (
            <select
              className="mt-1 border rounded px-2 py-1 w-full"
              value={actId}
              onChange={(e) => setActId(e.target.value)}
            >
              <option value="">選択してください</option>
              {myActs.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.act_type ? `（${a.act_type}）` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 会場 */}
        <label className="block">
          <span className="text-sm font-medium">
            <RequiredLabel label={fields.venue_name.label} />
          </span>
          <input
            type="text"
            className="mt-1 border rounded px-2 py-1 w-full"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="例: NINETY EAST / 水戸駅前ストリート"
          />
        </label>

        {/* メモ */}
        <label className="block">
          <span className="text-sm font-medium">
            <RequiredLabel label={fields.memo.label} />
          </span>
          <textarea
            className="mt-1 border rounded px-2 py-1 w-full h-24"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="出演時間、共演者、イベント名など"
          />
        </label>

        {missingRequired && (
          <div className="text-xs text-red-600">
            ※ 必須項目を入力してください
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || noActs || missingRequired}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
        >
          {saving ? "保存中…" : "このライブを記録する"}
        </button>
      </div>
    </main>
  );
}
