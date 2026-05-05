"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/lib/supabase/client";

type Venue = { id: string; name: string };

export type PersonalPerformanceCoreEditorHandle = {
  save: () => Promise<{ eventDate: string; venueId: string | null; venueName: string | null }>;
};

export const PersonalPerformanceCoreEditor = forwardRef<
  PersonalPerformanceCoreEditorHandle,
  {
    performanceId: string;
    eventDate: string;
    venueId: string | null;
    venueName: string | null;
    venues: Venue[];
  }
>(function PersonalPerformanceCoreEditor(props, ref) {
  const [draftDate, setDraftDate] = useState(props.eventDate);
  const [draftVenueId, setDraftVenueId] = useState<string>(props.venueId ?? "");
  const [draftVenueName, setDraftVenueName] = useState(props.venueName ?? "");

  async function save() {
    const { error } = await supabase.rpc("update_personal_performance_core", {
      p_performance_id: props.performanceId,
      p_event_date: draftDate,
      p_venue_id: draftVenueId ? draftVenueId : null,
      p_venue_name: draftVenueId ? null : (draftVenueName.trim() || null),
    });
    if (error) throw new Error(error.message);
    return {
      eventDate: draftDate,
      venueId: draftVenueId || null,
      venueName: draftVenueId ? null : (draftVenueName.trim() || null),
    };
  }

  useImperativeHandle(ref, () => ({ save }));

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">日付・会場（個人登録）</h3>

      <div className="space-y-3">
        <div className="grid grid-cols-[120px_1fr] items-center gap-3 min-w-0">
          <div className="text-sm text-neutral-600">日付</div>
          <input
            type="date"
            className="w-full min-w-0 rounded-md border px-3 py-2"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-[120px_1fr] items-center gap-3">
          <div className="text-sm text-neutral-600">会場</div>
          {props.venues.length > 0 ? (
            <select
              className="w-full rounded-md border px-3 py-2"
              value={draftVenueId}
              onChange={(e) => setDraftVenueId(e.target.value)}
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
            />
          </div>
        )}

      </div>
    </section>
  );
});
