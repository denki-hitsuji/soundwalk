"use client";

import { useTransition, useState } from "react";
import {
  reconfirmPerformance,
  declineReconfirmPerformance,
} from "@/app/actions/reconfirmPerformance";

type Props = {
  performanceId: string;
  status: string;
  statusReason?: string | null;
};

export function PerformanceReconfirmBanner({ performanceId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (status !== "pending_reconfirm") return null;

  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="font-semibold">要再確認</div>
      <div className="text-sm text-neutral-700">
        イベントの<strong>日付または会場が変更</strong>されたため、出演の再確認が必要です。
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          className="rounded-md border px-3 py-2"
          disabled={isPending}
          onClick={() => setOpen(true)}
        >
          辞退する…
        </button>
        <button
          className="rounded-md border px-3 py-2"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await reconfirmPerformance(performanceId);
              // あなたの実装方針に合わせて router.refresh() 推奨
              window.location.reload();
            })
          }
        >
          OK（出演します）
        </button>
      </div>

      {open && (
        <div className="rounded-xl border p-4 space-y-3">
          <div className="font-semibold">辞退しますか？</div>
          <div className="text-sm text-neutral-700">
            辞退すると、この出演はキャンセル扱いになります。
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="rounded-md border px-3 py-2"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              戻る
            </button>
            <button
              className="rounded-md border px-3 py-2"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await declineReconfirmPerformance(performanceId);
                  window.location.reload();
                })
              }
            >
              辞退を確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
