// app/events/[eventId]/page.tsx
import { getEventBookings, getPublicEventForBooking } from "@/lib/api/venues";
import { BookingForm } from "../../../../components/acts/BookingForm";
import { getCurrentUser } from "@/lib/auth/session.server";
import { ensureMyDefaultAct } from "@/lib/api/actsAction";
import OrganizedEventDetailClient from "@/components/organizer/OrganizedEventDetailClient";
import { getEventActs, getEventById } from "@/lib/api/events";
import { kMaxLength } from "buffer";
import { getAllActs } from "@/lib/api/acts";

export const dynamic = "force-dynamic"; // ★ビルド時の静的評価を避ける
export default async function PublicEventPage({ params }: { params: Promise<{ eventId : string }> }) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインが必要です。");

  if (!eventId) {
    throw new Error("eventId param is missing");
  }

  const { event, acceptedCount } = await getPublicEventForBooking(eventId);
  const eventWithVenue = await getEventById(eventId);
  if (!eventWithVenue) {
    throw new Error("Couldn't get event information");
  }
  const eventBookings = await getEventBookings(eventId);
  if (!eventBookings) {
    throw new Error("Couldn't get event bookings");
  }
  console.log(eventBookings);
  const allActs = await getAllActs();
  if (!allActs) {
    throw new Error("Couldn't get all acts");
  }
  const eventActs = await getEventActs({ eventId: eventId });
  const actsForTheEvent = allActs.filter(a => eventActs.find(ea => ea.act_id === a.id));

  if (!eventActs) {
    throw new Error("Couldn't get event acts");
  }

  return (
    <main className="space-y-6">
      {/* ブッキングフォーム（クライアント側で書き込み） */}
      <OrganizedEventDetailClient
        userId={user?.id}
        event={eventWithVenue}
        eventBookings={eventBookings}
        eventActs={actsForTheEvent}
        allActs={allActs}
      />
    </main>
  );
}
