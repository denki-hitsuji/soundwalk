// app/events/[eventId]/page.tsx
"use server"
import { getPublicEventForBooking } from "@/lib/api/venues";
import { BookingForm } from "./BookingForm";
import { getCurrentUser } from "@/lib/auth/session.server";

type Props = {
  eventId: string ;
};

export default async function PublicEventPage({ eventId }: Props) {
  // const user = await getCurrentUser();
  // if (!user) throw new Error("ログインが必要です。");

  // if (!eventId) {
  //   throw new Error("eventId param is missing");
  // }

  // const { event, acceptedCount } = await getPublicEventForBooking(eventId);

  return (
    <div></div>
    // <main className="space-y-6">
    //   {/* イベント情報 */}
    //   <section>
    //     <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
    //     <p className="text-sm text-gray-600">
    //       {event.event_date} {event.start_time.slice(0, 5)} 〜{" "}
    //       {event.end_time.slice(0, 5)}
    //     </p>
    //     <p className="text-sm text-gray-600">
    //       枠: {acceptedCount}/{event.max_artists ?? "∞"}
    //     </p>

    //   </section>

    //   {/* ブッキングフォーム（クライアント側で書き込み） */}
    //   <BookingForm userId={ user?.id} event={event} />
    // </main>
  );
}
