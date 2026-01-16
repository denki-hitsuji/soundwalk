"use server"
import OrganizedEventsListClient from "@/components/organizer/OrganizedEventsListClient";
import { getEventActs, getMyEvents } from "@/lib/api/events";
import { getCurrentUser } from "@/lib/auth/session.server";
import { EventActRow, EventWithAct } from "@/lib/utils/events";
import { redirect } from "next/navigation";

export default async function MusicianOrganizedEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const eventWithVenues = await getMyEvents(); 
  const eventActs = new Array<EventActRow>;
  eventWithVenues.map(async e => eventActs.concat(await getEventActs({ eventId: e.id })));
  return <OrganizedEventsListClient userId={user?.id} events={eventWithVenues} eventActs={eventActs}/>;
}
