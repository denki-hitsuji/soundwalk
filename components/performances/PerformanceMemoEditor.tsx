"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toYmdLocal } from "@/lib/dateUtils";

type Props = {
  performanceId: string;
  eventDate: string; // YYYY-MM-DD
  initialRecordMemo: string | null; // musician_performances.memo
  initialPrepNotes: string | null; // performance_details.notes
  className?: string;
};

export function PerformanceMemoEditor({
  performanceId,
  eventDate,
  initialRecordMemo,
  initialPrepNotes,
  className,
}: Props) {
  const todayStr = useMemo(() => toYmdLocal(), []);
  const isFutureOrToday = eventDate >= todayStr;

  const [prepNotes, setPrepNotes] = useState(initialPrepNotes ?? "");
  const [recordMemo, setRecordMemo] = useState(initialRecordMemo ?? "");

  const [savingPrep, setSavingPrep] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [prepSavedAt, setPrepSavedAt] = useState<string | null>(null);
  const [recordSavedAt, setRecordSavedAt] = useState<string | null>(null);

  const prepChanged = (prepNotes ?? "") !== (initialPrepNotes ?? "");
  const recordChanged = (recordMemo ?? "") !== (initialRecordMemo ?? "");

  const savePrep = async () => {
    setSavingPrep(true);
    try {
      const payload = {
        performance_id: performanceId,
        notes: prepNotes.trim() ? prepNotes.trim() : null,
        updated_at: new Date().toISOString(),
      };

      // details行が無い可能性に備えて upsert
      const { error } = await supabase
        .from("performance_details")
        .upsert(payload, { onConflict: "performance_id" });

      if (error) throw error;
      setPrepSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSavingPrep(false);
    }
  };

  const saveRecord = async () => {
    setSavingRecord(true);
    try {
      const patch = {
        memo: recordMemo.trim() ? recordMemo.trim() : null,
      };

      const { error } = await supabase
        .from("musician_performances")
        .update(patch)
        .eq("id", performanceId);

      if (error) throw error;
      setRecordSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSavingRecord(false);
    }
  };

  // 未来は段取りを上、過去は記録を上（誘導）。ただしロックはしない。
  const First = isFutureOrToday ? PrepCard : RecordCard;
  const Second = isFutureOrToday ? RecordCard : PrepCard;

  return (
    <section className={["space-y-3", className ?? ""].join(" ")}>
      <div className="text-sm font-semibold">メモ</div>

      <div className="grid gap-3">
        <First
          value={isFutureOrToday ? prepNotes : recordMemo}
          onChange={isFutureOrToday ? setPrepNotes : setRecordMemo}
          onSave={isFutureOrToday ? savePrep : saveRecord}
          saving={isFutureOrToday ? savingPrep : savingRecord}
          changed={isFutureOrToday ? prepChanged : recordChanged}
          savedAt={isFutureOrToday ? prepSavedAt : recordSavedAt}
        />

        <Second
          value={isFutureOrToday ? recordMemo : prepNotes}
          onChange={isFutureOrToday ? setRecordMemo : setPrepNotes}
          onSave={isFutureOrToday ? saveRecord : savePrep}
          saving={isFutureOrToday ? savingRecord : savingPrep}
          changed={isFutureOrToday ? recordChanged : prepChanged}
          savedAt={isFutureOrToday ? recordSavedAt : prepSavedAt}
        />
      </div>

      {/* <div className="text-[11px] text-gray-500">
        ※ 編集ロックはしません。未来は「段取り」、過去は「記録」を上に置くだけで自然に使い分けできる設計です。
      </div> */}
    </section>
  );
}

function PrepCard(props: CardProps) {
  return (
    <MemoCard
      title="段取りメモ"
      help="機材 / 駐車 / 集合 / 入り〜出番 / 当日の注意など。ライブ前に更新されがちな情報。"
      placeholder="例：駐車場は裏 / 集合18:30 / 物販テーブルあり / 持込DI必要…"
      emphasize
      {...props}
    />
  );
}

function RecordCard(props: CardProps) {
  return (
    <MemoCard
      title="記録メモ"
      help="セトリ / 振り返り / できごと / 次回の改善点。終演後に静かに残す用。"
      placeholder="例：セトリ、良かった点、次回の改善点、印象的な出来事…"
      {...props}
    />
  );
}

type CardProps = {
  value: string;
  onChange: (v: string) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  changed: boolean;
  savedAt: string | null;
};

function MemoCard({
  title,
  help,
  placeholder,
  emphasize,
  value,
  onChange,
  onSave,
  saving,
  changed,
  savedAt,
}: {
  title: string;
  help: string;
  placeholder: string;
  emphasize?: boolean;
} & CardProps) {
  return (
    <div
      className={[
        "rounded-xl border bg-white p-3 space-y-2",
        emphasize ? "ring-1 ring-blue-200" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-gray-500">{help}</div>
          {savedAt && <div className="text-[11px] text-gray-400 mt-0.5">保存: {savedAt}</div>}
        </div>

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving || !changed}
          className="shrink-0 rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[110px] rounded border px-3 py-2 text-sm"
      />

      {changed && (
        <div className="text-[11px] text-gray-500">未保存の変更があります</div>
      )}
    </div>
  );
}
