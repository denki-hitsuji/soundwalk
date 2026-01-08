"use server"
import OrganizedEventDetailClient from "@/components/organizer/OrganizedEventDetailClient";
import { getActsByIds, getAllActs } from "@/lib/api/acts";
import { getEventActs, getEventById, getMyEvents } from "@/lib/api/events";
import { getEventBookings } from "@/lib/api/venues";
import { getCurrentUser } from "@/lib/auth/session.server";
import { redirect } from "next/navigation";

export default async function OrganizerEventDetailPage(
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  // const user = await getCurrentUser();
  // if (!user) redirect("/login");

  // const event = await (await getMyEvents()).find(e => e.id == eventId);
  // if (!event) throw Error("イベントが見つかりません。");
  // const relatedIds = (await getEventActs({ eventId: event?.id })).map(ea => ea.event_act.act_id);
  // const eventActs = await getActsByIds(relatedIds);
  // const eventBookings = await getEventBookings(eventId);
  // const allActs = await getAllActs();
  return (
    <div>
      {/* <OrganizedEventDetailClient
    userId={user?.id} event={event} eventActs={eventActs}
    eventBookings={eventBookings} allActs={allActs}
  />; */}
  </div>
  )

}