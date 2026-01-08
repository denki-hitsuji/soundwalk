import OrganizedEventsListClient from "@/components/organizer/OrganizedEventsListClient";
import { getEventActs, getMyEvents } from "@/lib/api/events";
import { getCurrentUser } from "@/lib/auth/session.server";
import { EventWithAct } from "@/lib/utils/events";
import { redirect } from "next/navigation";

export default async function MusicianOrganizedEventsPage() {
  const user = await getCurrentUser();
  const eventWithVenues = await getMyEvents(); 
  const eventActs = new Array<EventWithAct>;
  eventWithVenues.map(async e => eventActs.concat(await getEventActs({ eventId: e.id })));
  if (!user) redirect("/login");
  return <OrganizedEventsListClient userId={ user?.id } events={eventWithVenues} eventActs={eventActs} />;
}
