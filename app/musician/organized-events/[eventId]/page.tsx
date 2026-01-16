import OrganizedEventsListClient from "@/components/organizer/OrganizedEventsListClient";
import { getEventActs, getMyEvents } from "@/lib/api/events";
import { getCurrentUser } from "@/lib/auth/session.server";
import { EventActRow } from "@/lib/utils/events";
import { redirect } from "next/navigation";

export default async function MusicianOrganizedEventsPage() {
  const user = await getCurrentUser();
  const eventWithVenues = await getMyEvents(); 
  const eventActs = await eventWithVenues.map(async e => await getEventActs({ eventId: e.id })).reduce(async (a, b) => (await a).concat(await b));
  if (!user) redirect("/login");
  return <OrganizedEventsListClient userId={ user?.id } events={eventWithVenues} eventActs={eventActs} />;
}
