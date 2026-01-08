// app/venue/events/page.tsx
"use server"
import { EventRow, EventWithAct, EventWithCount } from "@/lib/utils/events";
import { getEventActs, getMyEvents } from "@/lib/api/events";
import Link from "next/link";

export default async function VenueEventsPage() {
    // 1. 全イベント + venues.name を取得
    const events = await getMyEvents();
    if (!events || events.length === 0) {
      return;
    }

    const eventList = events as EventRow[];
    const eventIds = eventList.map((e) => e.id);

    // 2. event_acts から acceptedCount を集計
    const actRows: EventWithAct[] = [];
    eventIds.map(async id => actRows.concat(await getEventActs({ eventId: id })));
    const countMap = new Map<string, number>();
    for (const row of actRows ?? []) {
      countMap.set(
        row.id,
        (countMap.get(row.id) ?? 0) + 1,
      );
    }

    const withCount: EventWithCount[] = eventList.map((e) => ({
      ...e,
      acceptedCount: countMap.get(e.id) ?? 0,
    }));

  // ===== UI =====

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-2">イベント一覧</h1>
      <p className="text-sm text-gray-600">
        登録済みのイベント枠と、決定済みの組数を一覧で確認できます。
      </p>

      {/* {error && <p className="text-sm text-red-500">{error}</p>} */}

      {/* {!error && events.length === 0 && (
        <p className="text-sm text-gray-500">まだイベントがありません。</p>
      )} */}

      <ul className="space-y-2">
        {withCount.map((event) => (
          <li key={event.id}>
            <Link
              href={`/venue/events/${event.id}`}
              className="block border rounded p-3 bg-white shadow-sm hover:bg-gray-50 transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{event.title}</div>

                  {event.venue_id  && (
                    <div className="text-[11px] text-gray-500">
                      会場: {event.venue_id}
                    </div>
                  )}

                  <div className="text-xs text-gray-600">
                    {event.event_date} {event.start_time.slice(0, 5)} 〜{" "}
                    {event.end_time.slice(0, 5)}
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-mono text-sm">
                    {event.acceptedCount} / {event.max_artists ?? "∞"}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    決定済み / 最大組数
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
