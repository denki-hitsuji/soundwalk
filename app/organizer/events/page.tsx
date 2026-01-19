"use server";

import OrganizedEventsListClient from "@/components/organizer/OrganizedEventsListClient";
import { getCurrentUser } from "@/lib/auth/session.server";
import { redirect } from "next/navigation";
import { getEventActs, getMyEvents } from "@/lib/api/events";

export default async function OrganizerEventsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const events = await getMyEvents();

  const eventActs = (
    await Promise.all(events.map((e) => getEventActs({ eventId: e.id })))
  ).flat();

  return (
    <OrganizedEventsListClient
      userId={user.id}
      events={events}
      eventActs={eventActs}
    />
  );
}
