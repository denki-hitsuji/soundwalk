// app/organizer/shows/[showId]/page.tsx
import { getEventBookings, getPublicEventForBooking } from "@/lib/api/venues";
import { getCurrentUser } from "@/lib/auth/session.server";
import OrganizedEventDetailClient from "@/components/organizer/OrganizedEventDetailClient";
import { getEventActs, getEventById } from "@/lib/api/events";
import { getAllActs } from "@/lib/api/acts";
import { getEventAttachmentsDb } from "@/lib/db/eventAttachments";

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
  const allActs = await getAllActs();
  if (!allActs) {
    throw new Error("Couldn't get all acts");
  }
  const eventActs = await getEventActs({ eventId: eventId });
  const actsForTheEvent = allActs.filter(a => eventActs.find(ea => ea.act_id === a.id));

  if (!eventActs) {
    throw new Error("Couldn't get event acts");
  }

  // フライヤー取得
  const eventAttachments = await getEventAttachmentsDb({ eventId });

  return (
    <main className="space-y-6">
      <OrganizedEventDetailClient
        userId={user?.id}
        event={eventWithVenue}
        eventBookings={eventBookings}
        eventActs={actsForTheEvent}
        allActs={allActs}
        eventAttachments={eventAttachments}
      />
    </main>
  );
}
