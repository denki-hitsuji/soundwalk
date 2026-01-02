// app/events/[eventId]/page.tsx
import { getPublicEventForBooking } from "@/lib/db/venues";
import { BookingForm } from "./BookingForm";

type Props = {
  params: Promise<{ eventId: string }>;
};

export default async function PublicEventPage({ params }: Props) {
  const { eventId } = await params;

  if (!eventId) {
    throw new Error("eventId param is missing");
  }

  const { event, acceptedCount } = await getPublicEventForBooking(eventId);

  return (
    <main className="space-y-6">
      {/* イベント情報 */}
      <section>
        <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
        <p className="text-sm text-gray-600">
          {event.event_date} {event.start_time.slice(0, 5)} 〜{" "}
          {event.end_time.slice(0, 5)}
        </p>
        <p className="text-sm text-gray-600">
          枠: {acceptedCount}/{event.max_artists ?? "∞"}
        </p>
        {event.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm">{event.description}</p>
        )}
      </section>

      {/* ブッキングフォーム（クライアント側で書き込み） */}
      <BookingForm eventId={eventId} />
    </main>
  );
}
