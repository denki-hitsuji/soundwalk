// app/venue/events/[eventId]/page.tsx の一部
import Link from "next/link";
import { getEventWithDetails } from "@/lib/venueQueries";
import { BookingApprovalList } from "./BookingApprovalList";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { eventId } = await params;
  const { event, acceptedCount, acts } = await getEventWithDetails(eventId);

  return (
    <main className="p-4 space-y-6">
      {/* イベント基本情報 */}
      <section className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-2">{event.title}</h1>
          <p className="text-sm text-gray-600">
            {event.event_date} {event.start_time.slice(0, 5)} 〜{" "}
            {event.end_time.slice(0, 5)}
          </p>
          <p className="text-sm text-gray-600">
            枠: {acceptedCount}/{event.max_artists ?? "∞"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ステータス: {event.status}
          </p>
        </div>
        {/* ★ 編集ページへのリンク */}
        <div className="text-right">
          <Link
            href={`/venue/events/${event.id}/edit`}
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            このイベントを編集する
          </Link>
        </div>
      </section>
      {/* 出演名義一覧（event_acts） */}
      <section>
        <h2 className="font-semibold mb-2">出演名義（event_acts）</h2>
        {acts.length === 0 && (
          <p className="text-sm text-gray-500">まだ出演者はいません。</p>
        )}
        <ul className="space-y-1">
          {acts.map((ea) => (
            <li
              key={ea.act_id}
              className="flex items-center justify-between border rounded px-2 py-1"
            >
              <div>
                <div className="font-medium">{ea.act.name}</div>
                <div className="text-xs text-gray-500">{ea.act.act_type}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">
                {ea.status}
              </span>
            </li>
          ))}
        </ul>

      </section>

      {/* 出演名義 / 応募一覧は既存のまま */}
      {/* ...acts 表示... */}
      <BookingApprovalList eventId={event.id} />
    </main>
  );
}
