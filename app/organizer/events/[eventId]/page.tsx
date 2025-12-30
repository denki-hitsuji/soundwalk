import OrganizedEventDetailClient from "@/components/organizer/OrganizedEventDetailClient";

export default async function OrganizerEventDetailPage(
  props: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await props.params;
  return <OrganizedEventDetailClient eventId={eventId} />;
}