// app/musician/performances/[performanceId]/page.tsx
import { getCurrentUser } from "@/lib/auth/session.server";
import PerformanceDetailClient from "./PerformanceDetailClient";
import { getMyOwnerVenues } from "@/lib/api/venues";
import { getPerformances } from "@/lib/utils/performance";
import { EventRow } from "@/lib/utils/events";
import { getEventById } from "@/lib/api/events";
import { getActById } from "@/lib/api/acts";
import { getDetailsForPerformance, getDetailsMapForPerformance, getDetailsMapForPerformances, getMyPerformanceById, getPerformanceAttachments, getPerformanceMessages } from "@/lib/api/performances";
import { getSetlistByPerformanceId, getSetlistItems } from "@/lib/api/setlistsAction";
import { getSongsByActIdsDb } from "@/lib/db/songs";

export default async function PerformanceDetailPage({ params }: {
  params: { performanceId: string }
}) {
  const p = await params;
  console.log(p);
  const performanceId = p.performanceId;

  // current user
  const user = await getCurrentUser();
  const currentProfileId = user?.id ?? null;

  // venues（個人登録編集で使う）
  const venues = await getMyOwnerVenues();
  // console.log(`venues: ${JSON.stringify(venues)}`);

  // performance
  // console.log(performanceId); 
  const perfs = await getPerformances();
  // console.log(JSON.stringify(perfs));
  const perf = perfs.data.find(p => p.id === performanceId );
  // console.log(JSON.stringify(perf));

  if (!perf) {
    return (
      <main className="p-4">
        <p className="text-sm text-red-600">ライブ情報が見つかりませんでした。</p>
      </main>
    );
  }

  // event（ある場合のみ）
  // console.log("getting event");
  let event = perf.event_id? await getEventById(perf?.event_id) : null;
  // console.log(event);
  // act（ある場合のみ）
  let act: any = await getActById(perf.act_id! );
  // console.log(act);

  // details（無ければnull）
  const details = await getDetailsForPerformance({ performanceId: performanceId });
  console.log(details);
  // attachments
  const attachments = await getPerformanceAttachments({ performanceId: performanceId });
  // console.log(attachments);
  // messages
  const messages = await getPerformanceMessages({ performanceId: performanceId });
  // console.log(messages);

  // setlist
  const setlist = await getSetlistByPerformanceId(performanceId);
  const setlistItems = setlist ? await getSetlistItems(setlist.id) : [];
  const actSongs = perf.act_id ? await getSongsByActIdsDb([perf.act_id]) : [];

  return (
    <PerformanceDetailClient
      performanceId={performanceId}
      currentProfileId={currentProfileId}
      performance={perf as any}
      act={act as any}
      event={await event}
      venues={venues}
      details={(details ?? null) as any}
      attachments={(attachments ?? []) as any}
      messages={(messages ?? []) as any}
      open_time={(perf.open_time ?? null) as any}
      start_time={(perf.start_time ?? null) as any}
      setlist={setlist}
      setlistItems={setlistItems}
      actSongs={actSongs}
    />
  );
}