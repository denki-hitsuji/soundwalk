import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getMyOwnerVenues } from "@/lib/api/venues";
import { getVenueEventsInRange } from "@/lib/api/events";
import { toYmdLocal } from "@/lib/utils/date";
import VenueCalendarClient from "./VenueCalendarClient";

export const dynamic = "force-dynamic";

export default async function VenueCalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 現在月±2ヶ月の範囲を計算（計5ヶ月分）
  const today = new Date();
  const startDate = toYmdLocal(
    new Date(today.getFullYear(), today.getMonth() - 2, 1)
  );
  const endDate = toYmdLocal(
    new Date(today.getFullYear(), today.getMonth() + 3, 0)
  );

  // 1. 管理している会場を取得
  const myVenues = await getMyOwnerVenues();
  const venueIds = myVenues.map((v) => v.id);

  // 2. その会場のイベントを日付範囲で取得
  const events = await getVenueEventsInRange(venueIds, startDate, endDate);

  return <VenueCalendarClient events={events} />;
}
