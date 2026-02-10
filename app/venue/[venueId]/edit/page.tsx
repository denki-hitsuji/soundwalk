// app/venue/[venueId]/edit/page.tsx
import { checkVenueAdmin, getVenueProfileById } from "@/lib/api/venues";
import { getCurrentUser } from "@/lib/auth/session.server";
import { redirect } from "next/navigation";
import { VenueEditClient } from "./VenueEditClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ venueId: string }>;
};

export default async function VenueEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { venueId } = await params;

  const isAdmin = await checkVenueAdmin(venueId);
  if (!isAdmin) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">アクセス権限がありません</h1>
        <p className="text-sm text-gray-600">
          この会場の編集権限がありません。
        </p>
      </div>
    );
  }

  const venue = await getVenueProfileById(venueId);
  if (!venue) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">会場が見つかりません</h1>
        <p className="text-sm text-gray-600">
          指定された会場が見つかりませんでした。
        </p>
      </div>
    );
  }

  return <VenueEditClient venueId={venueId} initialVenue={venue} />;
}
