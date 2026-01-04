"use client";

import { ActRow } from "@/lib/db/acts";
import { DetailsRow, PerformanceRow, PerformanceWithActs } from "@/lib/utils/performance";
import Link from "next/link";

type PrepDef = { key: string; label: string; offsetDays: number };

type Flyer = { file_url: string } | null | undefined;

// p はあなたの既存 shape をそのまま受ける（型で縛りすぎない）
export type PerformanceCardProps = {
  p: PerformanceWithActs;

  flyer?: Flyer;
  details?: DetailsRow;
  tasks?: Record<string, any>;

  prepDefs: readonly PrepDef[];
  todayDate: Date;

  // 既存関数を流用（ページ側から渡す）
  normalizeAct: (p: PerformanceWithActs) => ActRow | null;
  detailsSummary: (d?: DetailsRow) => string;

  // 既存 util を流用（ページ側から渡す）
  parseYmdLocal: (s: string) => Date;
  addDays: (d: Date, days: number) => Date;
  fmtMMdd: (d: Date) => string;
  statusText: (due: Date, today: Date) => string;

  // 既存処理を流用（ページ側から渡す）
  onToggleDone: (performanceId: string, taskKey: string) => void | Promise<void>;
};

export function PerformanceCard({
  p,
  flyer,
  details,
  tasks = {},
  prepDefs,
  todayDate,
  normalizeAct,
  detailsSummary,
  parseYmdLocal,
  addDays,
  fmtMMdd,
  statusText,
  onToggleDone,
}: PerformanceCardProps) {
  const venue = p.venue_name ? `@ ${p.venue_name}` : "@（未設定）";
  const act = normalizeAct(p);
  const actName = act?.name ?? "出演名義：なし";
  const summary = detailsSummary(details);
  const status = p.status ?? "confirmed";
  const isMusician = p.id !== ""; // 仮の条件
  const clickable = Boolean(isMusician);
  const statusStyleMap: Record<string, string> = {
    offered: "bg-blue-100 text-blue-800",
    pending_reconfirm: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    canceled: "bg-gray-100 text-gray-500",
  };

  const statusLabelMap: Record<string, string> = {
    offered: "🟡 オファー",
    pending_reconfirm: "🟣 要再確認",
    confirmed: "✅ 確定",
    canceled: "⚪ 辞退",
  };
  const rootClass = [
    "block p-2 rounded-xl border shadow-sm flex",
    clickable ? "hover:bg-gray-50 cursor-pointer" : "",
  ].join(" ");
  console.log(`flyer on card: ${JSON.stringify(flyer)}`)

  const cardBody = (
    <div className="w-full">
      {/* <div className="px-3 py-1">
        <p className="mr-2">{statusLabelMap[status]}</p>
      </div> */}
      <div className="px-2 py-2d flex gap-3">
        {
          flyer ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flyer.file_url}
            alt="フライヤー"
            className="h-24 w-24 rounded object-cover border"
            loading="lazy"
          />
        ) : (
          <div className="h-24 w-24 rounded border bg-gray-50 flex items-center justify-center text-[11px] text-gray-400">
            flyerなし
          </div>
        )}

        <div className="flex-1 min-w-10">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold">
              {p.event_date}
              {p.venue_name && (
                <span className="ml-1 text-gray-600 font-normal">
                  @ {p.venue_name}
                </span>
              )}
              {p.event_title && (
                <div className="ml-1 text-gray-600 font-normal">
                  {p.event_title}
                </div>
              )}
            </div>

            {statusLabelMap[status] && (
              <span
                className={[
                  "shrink-0 rounded px-1 py-0.5 text-[11px] font-medium",
                  statusStyleMap[status] ?? "bg-gray-100 text-gray-700",
                ].join(" ")}
              >
                {statusLabelMap[status]}
              </span>
            )}
          </div>


          <div className="text-base font-bold truncate">{actName}</div>

          {isMusician && (
          <div className="mt-2 text-xs text-gray-700 ">{summary}</div>
          )}

          {/* 段取り（永続化＆共有） */}
          {isMusician && (
            <div className="mt-2 flex flex-wrap gap-2">
              {prepDefs.map((def) => {
                const row = tasks[def.key];
                const due = row?.due_date
                  ? parseYmdLocal(row.due_date)
                  : addDays(parseYmdLocal(p.event_date), def.offsetDays);

                const dueLabel = fmtMMdd(due);
                const done = row?.is_done === true;
                const stat = done ? "済" : statusText(due, todayDate);

                return (
                  <button
                    key={def.key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void onToggleDone(p.id, def.key);
                    }}
                    className={[
                      "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px]",
                      done ? "bg-gray-100 text-gray-600" : "bg-white text-gray-800",
                    ].join(" ")}
                    title="クリックで済/未済を切り替え"
                  >
                    <span className="text-gray-500">{dueLabel}</span>
                    <span className={done ? "line-through" : ""}>{def.label}</span>
                    <span className="text-gray-500">({stat})</span>
                  </button>
                );
              })}
            </div>
          )}

          {
            isMusician && (
              <div className="mt-1 text-[11px] text-gray-500">
                タップで詳細（フライヤー/案内文/確認事項） / 段取りはここでチェック可
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
if(isMusician) {
  return (
    <Link href={`/musician/performances/${p.id}`}
      className={`${rootClass} ${statusStyleMap[status]}`}>
      {cardBody}
    </Link>
  );
} else {
  return <div className={`${rootClass} ${statusStyleMap[status]}`}>{cardBody}</div>;
} 
}
