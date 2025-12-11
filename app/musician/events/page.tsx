// app/musician/events/page.tsx
import { getRecruitingEvents } from "@/lib/venueQueries";

export default async function MusicianEventsPage() {
  const events = await getRecruitingEvents();

  return (
    <main className="p-4 space-y-4">
      <h1 className="text-xl font-bold mb-4">募集中のイベント一覧</h1>

      {events.length === 0 && (
        <p className="text-sm text-gray-500">現在募集中のイベントはありません。</p>
      )}

      <ul className="space-y-2">
        {events.map((event) => (
          <a  href={`/events/${event.id}`}> 
          <li
            key={event.id}
            className="border rounded p-3 flex items-center justify-between"
          >
            <div>
              <div className="font-semibold">{event.title}</div>
              <div className="text-sm text-gray-600">
                {event.event_date}{" "}
                {event.start_time.slice(0, 5)} 〜 {event.end_time.slice(0, 5)}
              </div>
            </div>
            <div className="text-sm text-right">
              <div>
                枠:{" "}
                <span className="font-mono">
                  {event.acceptedCount}/{event.max_artists ?? "∞"}
                </span>
              </div>
              {/* ここに詳細ページへのリンクを後で足してOK */}
              {/* <Link href={`/events/${event.id}`} className="text-xs underline">
                詳細を見る
              </Link> */}
            </div>
          </li></a> 
        ))}
      </ul>
    </main>
  );
}
