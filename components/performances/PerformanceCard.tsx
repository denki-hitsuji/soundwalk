"use client";

import Link from "next/link";

type PrepDef = { key: string; label: string; offsetDays: number };

type Flyer = { file_url: string } | null | undefined;

// p はあなたの既存 shape をそのまま受ける（型で縛りすぎない）
export type PerformanceCardProps = {
  p: any;

  flyer?: Flyer;
  details?: any;
  tasks?: Record<string, any>;

  prepDefs: readonly PrepDef[];
  todayDate: Date;

  // 既存関数を流用（ページ側から渡す）
  normalizeAct: (p: any) => any | null;
  detailsSummary: (d: any) => string;

  // 既存 util を流用（ページ側から渡す）
  toYmdLocal: (s: string) => Date;
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
  toYmdLocal,
  addDays,
  fmtMMdd,
  statusText,
  onToggleDone,
}: PerformanceCardProps) {
  const venue = p.venue_name ? `@ ${p.venue_name}` : "@（未設定）";
  const act = normalizeAct(p);
  const actName = act?.name ?? "出演名義：なし";
  const summary = detailsSummary(details);

  return (
    <Link
      href={`/musician/performances/${p.id}`}
      className="block rounded-xl border bg-white shadow-sm hover:bg-gray-50"
    >
      <div className="p-3 flex gap-3">
        {flyer ? (
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

        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            {p.event_date}{" "}
            <span className="text-gray-700 font-normal">{venue}</span>
          </div>

          <div className="text-base font-bold truncate">{actName}</div>

          <div className="mt-2 text-xs text-gray-700 truncate">{summary}</div>

          {/* 段取り（永続化＆共有） */}
          <div className="mt-2 flex flex-wrap gap-2">
            {prepDefs.map((def) => {
              const row = tasks[def.key];
              const due = row?.due_date
                ? toYmdLocal(row.due_date)
                : addDays(toYmdLocal(p.event_date), def.offsetDays);

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

          <div className="mt-1 text-[11px] text-gray-500">
            タップで詳細（フライヤー/案内文/確認事項） / 段取りはここでチェック可
          </div>
        </div>
      </div>
    </Link>
  );
}
