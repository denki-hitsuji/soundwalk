import { getCurrentUser } from "@/lib/auth/session.server";
import OrganizedEventEditClient from "./OrganizedEventEditClient";
import { redirect } from "next/navigation";
import { getEventById } from "@/lib/api/events";
import { getAllVenues } from "@/lib/api/venues";

export default async function OrganizerEventEditPage(
  props: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const userId = user?.id;
  const event = await getEventById(eventId);
  if (!event) throw Error("イベントが取得できません。")
  const allVenues = await getAllVenues();
  return <OrganizedEventEditClient userId={ userId } event={event}  allVenues={allVenues}/>;
}
