"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { RehearsalRow } from "@/lib/utils/rehearsals";
import { formatRehearsalTime } from "@/lib/utils/rehearsals";
import type { ActRow } from "@/lib/utils/acts";
import { addRehearsalAction, deleteRehearsalAction } from "@/lib/api/rehearsalsAction";

type Props = {
  rehearsals: RehearsalRow[];
  myActs: ActRow[];
  currentProfileId: string;
  initialActId: string | null;
};

export default function RehearsalsClient({
  rehearsals,
  myActs,
  currentProfileId,
  initialActId,
}: Props) {
  const router = useRouter();

  const [filterActId, setFilterActId] = useState(initialActId ?? "");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    act_id: initialActId ?? myActs[0]?.id ?? "",
    rehearsal_date: "",
    start_time: "",
    end_time: "",
    studio_name: "",
    memo: "",
  });

  const filtered = useMemo(() => {
    if (!filterActId) return rehearsals;
    return rehearsals.filter((r) => r.act_id === filterActId);
  }, [rehearsals, filterActId]);

  const actNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const a of myActs) m[a.id] = a.name;
    return m;
  }, [myActs]);

  const handleFilterChange = (actId: string) => {
    setFilterActId(actId);
    if (actId) {
      router.push(`?actId=${actId}`);
    } else {
      router.push("?");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.act_id || !form.rehearsal_date) return;
    setAdding(true);
    try {
      await addRehearsalAction({
        act_id: form.act_id,
        rehearsal_date: form.rehearsal_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        studio_name: form.studio_name || null,
        memo: form.memo || null,
      });
      setForm((f) => ({ ...f, rehearsal_date: "", start_time: "", end_time: "", studio_name: "", memo: "" }));
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("このリハーサルを削除しますか？")) return;
    setDeletingId(id);
    try {
      await deleteRehearsalAction(id);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">リハーサル管理</h1>

      {/* フィルター */}
      <section className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <label className="block text-xs text-gray-500 mb-1">アクトで絞り込み</label>
        <select
          className="w-full rounded border px-2 py-1.5 text-sm"
          value={filterActId}
          onChange={(e) => handleFilterChange(e.target.value)}
        >
          <option value="">すべてのアクト</option>
          {myActs.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </section>

      {/* 追加フォーム */}
      <section className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">リハーサルを追加</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 block">
              <span className="text-[11px] text-gray-500">アクト</span>
              <select
                required
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={form.act_id}
                onChange={(e) => setForm((f) => ({ ...f, act_id: e.target.value }))}
              >
                <option value="">選択してください</option>
                {myActs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="col-span-2 block">
              <span className="text-[11px] text-gray-500">日付</span>
              <input
                required
                type="date"
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={form.rehearsal_date}
                onChange={(e) => setForm((f) => ({ ...f, rehearsal_date: e.target.value }))}
              />
            </label>

            <label className="block">
              <span className="text-[11px] text-gray-500">開始時間</span>
              <input
                type="time"
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </label>

            <label className="block">
              <span className="text-[11px] text-gray-500">終了時間</span>
              <input
                type="time"
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </label>

            <label className="col-span-2 block">
              <span className="text-[11px] text-gray-500">スタジオ名</span>
              <input
                type="text"
                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                value={form.studio_name}
                onChange={(e) => setForm((f) => ({ ...f, studio_name: e.target.value }))}
                placeholder="例：スタジオA"
              />
            </label>

            <label className="col-span-2 block">
              <span className="text-[11px] text-gray-500">メモ</span>
              <textarea
                className="mt-1 w-full rounded border px-2 py-1 text-sm h-20"
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="練習内容など"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={adding || !form.act_id || !form.rehearsal_date}
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {adding ? "追加中…" : "追加"}
          </button>
        </form>
      </section>

      {/* 一覧 */}
      <section className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <h2 className="text-sm font-semibold mb-3">
          リハーサル一覧{filtered.length > 0 ? `（${filtered.length}件）` : ""}
        </h2>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">リハーサルはまだありません。</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">{r.rehearsal_date}</div>
                  <div className="text-xs text-gray-600">
                    {actNameMap[r.act_id] && (
                      <span className="mr-2 font-medium">{actNameMap[r.act_id]}</span>
                    )}
                    {r.studio_name && <span>{r.studio_name}</span>}
                    {formatRehearsalTime(r.start_time, r.end_time) && (
                      <span className="ml-2 text-gray-500">
                        {formatRehearsalTime(r.start_time, r.end_time)}
                      </span>
                    )}
                  </div>
                  {r.memo && (
                    <div className="mt-1 text-xs text-gray-500 whitespace-pre-wrap">{r.memo}</div>
                  )}
                </div>

                {r.created_by_profile_id === currentProfileId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="shrink-0 rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === r.id ? "削除中…" : "削除"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
