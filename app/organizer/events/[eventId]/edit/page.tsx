import OrganizedEventEditClient from "./OrganizedEventEditClient";

export default async function OrganizerEventEditPage(
  props: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await props.params;
  return <OrganizedEventEditClient eventId={eventId} />;
}
