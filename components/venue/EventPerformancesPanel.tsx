// components/venue/EventPerformancesPanel.tsx
"use client";

import { useTransition } from "react";
import { organizerCancelPerformance } from "@/app/actions/organizerCancelPerformance";
import { useRouter } from "next/navigation";

type PerformanceRow = {
  id: string;
  profile_id: string;
  act_id: string | null;
  status: string | null;
  status_reason: string | null;
  status_changed_at: string | null;
  created_at: string | null;
  act_name: string | null;
  profile_name: string | null;
};

export function EventPerformancesPanel(props: {
  eventId: string;
  maxArtists: number | null;
  confirmedCount: number;
  pendingCount: number;
  performances: PerformanceRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const pending = props.performances.filter((p) => p.status === "pending_reconfirm");
  const confirmed = props.performances.filter((p) => p.status === "confirmed");
  const others = props.performances.filter(
    (p) => p.status !== "confirmed" && p.status !== "pending_reconfirm"
  );

  return (
    <section className="rounded-xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">出演者</h2>
        <div className="text-sm text-neutral-600">
          確定 {confirmed.length} / 要再確認 {pending.length}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold">要再確認</div>
          <div className="text-sm text-neutral-700">
            枠は保持されています。返事がない場合は主催者側で枠解放できます。
          </div>

          <ul className="divide-y rounded-lg border">
            {pending.map((p) => (
              <li key={p.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">
                    {labelName(p)}
                  </div>
                  <div className="text-xs text-neutral-600">
                    状態: {p.status} {p.status_reason ? `(${p.status_reason})` : ""}
                  </div>
                </div>

                <button
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={isPending}
                  onClick={() => {
                    const ok = confirm(
                      "この出演をキャンセルして枠を解放します。\n関係者への配慮のため、理由が必要なら後で理由入力も追加できます。\n実行しますか？"
                    );
                    if (!ok) return;

                    startTransition(async () => {
                      await organizerCancelPerformance(p.id, "ORGANIZER_CANCELED_RECONFIRM_NO_RESPONSE");
                      router.refresh();
                    });
                  }}
                >
                  枠を解放
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {confirmed.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold">確定</div>
          <ul className="divide-y rounded-lg border">
            {confirmed.map((p) => (
              <li key={p.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">{labelName(p)}</div>
                  <div className="text-xs text-neutral-600">
                    状態: {p.status}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-2">
          <div className="font-semibold">その他</div>
          <ul className="divide-y rounded-lg border">
            {others.map((p) => (
              <li key={p.id} className="p-3">
                <div className="truncate">{labelName(p)}</div>
                <div className="text-xs text-neutral-600">
                  状態: {p.status ?? "—"} {p.status_reason ? `(${p.status_reason})` : ""}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {props.performances.length === 0 && (
        <div className="text-sm text-neutral-700">
          まだ出演者がいません。
        </div>
      )}
    </section>
  );
}

function labelName(p: PerformanceRow) {
  // ここは「名義（act）」優先の方が現場感が出る
  const act = p.act_name ? `【${p.act_name}】` : "";
  const person = p.profile_name ?? p.profile_id;
  return `${act} ${person}`.trim();
}
