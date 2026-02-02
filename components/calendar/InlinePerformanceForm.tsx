"use client";

import { useState } from "react";
import Link from "next/link";
import { ActRow } from "@/lib/utils/acts";
import { upsertPerformance } from "@/lib/api/performancesAction";

type InlinePerformanceFormProps = {
  date: string; // YYYY-MM-DD
  myActs: ActRow[];
  userId: string;
  onSaved: () => void;
  onCancel: () => void;
};

export function InlinePerformanceForm({
  date,
  myActs,
  userId,
  onSaved,
  onCancel,
}: InlinePerformanceFormProps) {
  const [actId, setActId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = `${dateObj.getFullYear()}年${
    dateObj.getMonth() + 1
  }月${dateObj.getDate()}日 (${["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()]})`;

  const noActs = myActs.length === 0;
  const canSave = actId !== "" && !saving && !noActs;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await upsertPerformance({
        id: null,
        profile_id: userId,
        act_id: actId,
        event_date: date,
        venue_name: venueName || null,
        memo: memo || null,
      });
      onSaved();
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました。");
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-white border rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{formattedDate}に予定を追加</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* 出演名義 */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              出演名義 <span className="text-red-500">*</span>
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
              className="mt-1 border rounded px-2 py-1.5 w-full text-sm"
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
          <span className="text-sm font-medium">会場</span>
          <input
            type="text"
            className="mt-1 border rounded px-2 py-1.5 w-full text-sm"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="例: NINETY EAST / 水戸駅前ストリート"
          />
        </label>

        {/* メモ */}
        <label className="block">
          <span className="text-sm font-medium">メモ</span>
          <textarea
            className="mt-1 border rounded px-2 py-1.5 w-full text-sm h-16"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="出演時間、共演者、イベント名など"
          />
        </label>

        {/* ボタン */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {saving ? "保存中…" : "追加"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
