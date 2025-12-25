"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePersonalPerformanceCore } from "@/app/actions/updatePersonalPerformanceCore";

type Venue = { id: string; name: string };

export function PersonalPerformanceCoreEditor(props: {
  performanceId: string;
  eventDate: string;                 // "YYYY-MM-DD"
  venueId: string | null;
  venueName: string | null;
  venues: Venue[];                   // 候補（任意。空ならフリーテキストのみでもOK）
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [draftDate, setDraftDate] = useState(props.eventDate);
  const [draftVenueId, setDraftVenueId] = useState<string>(props.venueId ?? "");
  const [draftVenueName, setDraftVenueName] = useState(props.venueName ?? "");

  const venueLabel = useMemo(() => {
    if (props.venueId) return props.venues.find(v => v.id === props.venueId)?.name ?? props.venueName ?? "—";
    return props.venueName ?? "—";
  }, [props.venueId, props.venueName, props.venues]);

  const hasChanges =
    draftDate !== props.eventDate ||
    (draftVenueId || null) !== (props.venueId || null) ||
    (draftVenueId ? "" : draftVenueName.trim()) !== (props.venueId ? "" : (props.venueName ?? "").trim());

  function reset() {
    setDraftDate(props.eventDate);
    setDraftVenueId(props.venueId ?? "");
    setDraftVenueName(props.venueName ?? "");
  }

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">日付・会場（個人登録）</h3>
        {!isEditing ? (
          <button className="text-sm underline" onClick={() => setIsEditing(true)}>
            編集
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="text-sm underline"
              disabled={isPending}
              onClick={() => {
                reset();
                setIsEditing(false);
              }}
            >
              キャンセル
            </button>
            <button
              className="text-sm underline"
              disabled={isPending || !hasChanges}
              onClick={() => {
                startTransition(async () => {
                  await updatePersonalPerformanceCore({
                    performanceId: props.performanceId,
                    eventDate: draftDate,
                    venueId: draftVenueId ? draftVenueId : null,
                    venueName: draftVenueId ? null : (draftVenueName.trim() || null),
                  });
                  setIsEditing(false);
                  router.refresh();
                });
              }}
            >
              保存
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="text-sm text-neutral-800 space-y-1">
          <div><span className="text-neutral-600">日付：</span>{props.eventDate}</div>
          <div><span className="text-neutral-600">会場：</span>{venueLabel}</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <div className="text-sm text-neutral-600">日付</div>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-3">
            <div className="text-sm text-neutral-600">会場</div>

            {props.venues.length > 0 ? (
              <select
                className="w-full rounded-md border px-3 py-2"
                value={draftVenueId}
                onChange={(e) => setDraftVenueId(e.target.value)}
                disabled={isPending}
              >
                <option value="">（手入力）</option>
                {props.venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-neutral-600">候補会場リストなし（手入力のみ）</div>
            )}
          </div>

          {/* venueId を選んでいないときだけ手入力を出す */}
          {!draftVenueId && (
            <div className="grid grid-cols-[120px_1fr] items-center gap-3">
              <div className="text-sm text-neutral-600">会場名</div>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2"
                value={draftVenueName}
                onChange={(e) => setDraftVenueName(e.target.value)}
                placeholder="例）〇〇ライブハウス"
                disabled={isPending}
              />
            </div>
          )}

          <div className="text-xs text-neutral-600">
            ※ 会場を候補から選ぶと、会場名は自動で確定します（手入力のミスを防ぐため）
          </div>
        </div>
      )}
    </section>
  );
}
