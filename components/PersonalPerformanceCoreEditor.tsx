"use client";

import { useMemo, useState, useTransition } from "react";
import { supabase } from "@/lib/supabaseClient";

type Venue = { id: string; name: string };

export function PersonalPerformanceCoreEditor(props: {
  performanceId: string;
  eventDate: string; // "YYYY-MM-DD"
  venueId: string | null;
  venueName: string | null;
  venues: Venue[];
  onSaved?: () => void; // ★追加：保存後に親のreloadAllを呼べる
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [draftDate, setDraftDate] = useState(props.eventDate);
  const [draftVenueId, setDraftVenueId] = useState<string>(props.venueId ?? "");
  const [draftVenueName, setDraftVenueName] = useState(props.venueName ?? "");

  const venueLabel = useMemo(() => {
    if (props.venueId) return props.venues.find((v) => v.id === props.venueId)?.name ?? props.venueName ?? "—";
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

  async function save() {
    // venueId が未選択なら、手入力名は必須にしてもいい（好み）
    // if (!draftVenueId && !draftVenueName.trim()) throw new Error("会場名を入力してください。");

    const { error } = await supabase.rpc("update_personal_performance_core", {
      p_performance_id: props.performanceId,
      p_event_date: draftDate,
      p_venue_id: draftVenueId ? draftVenueId : null,
      p_venue_name: draftVenueId ? null : (draftVenueName.trim() || null),
    });

    if (error) throw new Error(error.message);
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
                  try {
                    await save();
                    setIsEditing(false);
                    props.onSaved?.(); // ★親がreloadAllを渡してくれれば即反映
                  } catch (e: any) {
                    console.error(e);
                    alert(e?.message ?? "保存に失敗しました。");
                  }
                });
              }}
              title={!hasChanges ? "変更がありません" : ""}
            >
              保存
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <div className="text-sm text-neutral-800 space-y-1">
          <div>
            <span className="text-neutral-600">日付：</span>
            {props.eventDate}
          </div>
          <div>
            <span className="text-neutral-600">会場：</span>
            {venueLabel}
          </div>
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
                {props.venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-neutral-600">候補会場リストなし（手入力のみ）</div>
            )}
          </div>

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
            ※ 会場を候補から選ぶと、会場名はDBの値で確定します（手入力ミス防止）
          </div>
        </div>
      )}
    </section>
  );
}
