"use server"
import OrganizedEventsListClient from "@/components/organizer/OrganizedEventsListClient";
import { getCurrentUser } from "@/lib/auth/session.server";
import { redirect } from "next/navigation";
import { getEventActs, getMyEvents } from "@/lib/api/events";

export default async function OrganizerEventsPage() {
  const user = await getCurrentUser();
  const eventWithVenues = await getMyEvents(); 
  const redundantEventActs =  eventWithVenues.map(async e => await getEventActs({ eventId: e.id }));
  const eventActs = (await redundantEventActs.reduce(async (a, b) => (await a).concat(await b)));
  console.log(JSON.stringify(eventActs));
  if (!user) redirect("/login");
  
  return <OrganizedEventsListClient userId={user?.id} events={eventWithVenues} eventActs={eventActs}/>;
}
