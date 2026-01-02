// app/venue/[venueId]/page.tsx
import { getVenueEventsWithAcceptedCount } from "@/lib/db/venues";

type Props = {
  params: { venueId: string };
};

export default async function VenuePage({ params }: Props) {
  const { venueId } = params;

  const events = await getVenueEventsWithAcceptedCount(venueId);

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold">この会場のイベント一覧</h1>

      {events.length === 0 && <p>まだイベントがありません。</p>}

      <ul className="space-y-2">
        {events.map((event) => (
          <li
            key={event.id}
            className="border rounded p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{event.title}</div>
              <div className="text-sm text-gray-500">
                {new Date(event.start_time).toLocaleString()} 〜{" "}
                {new Date(event.end_time).toLocaleString()}
              </div>
            </div>
            <div className="text-sm">
              <span className="font-mono">
                {event.acceptedCount}/{event.max_artists ?? "∞"}
              </span>{" "}
              枠確定
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
