// app/musician/acts/[actId]/page.tsx
"use server"
import { getActById, getMyMemberActs  } from "@/lib/api/acts";
import ActDetailClient from "./ActDetailClient";
import { getMyUpcomingPerformances, PerformanceRow, PerformanceWithActs } from "@/lib/api/performances";
import { getMySongs } from "@/lib/api/songs";
import { getCurrentUser } from "@/lib/auth/session.server";
import { ActRow, MemberRow } from "@/lib/utils/acts";
import { redirect } from "next/navigation";
import { EventRow } from "@/lib/utils/events";
import { getEventById } from "@/lib/api/events";
const rank = (s: string | null) => (s === "offered" ? 0 : s === "pending_reconfirm" ? 1 : 2);

export default async function Page({ params }: { params: Promise<{ actId: string }> }) {
  const { actId } = await params;
  const myAct = await getActById(actId);
  if(!myAct) redirect(`/musician/acts/`);

  const today = new Date();
  const todayYmd = today.toISOString().slice(0, 10);
  console.log("performanceの直前");
  const performances = await getMyUpcomingPerformances(todayYmd);
  console.log("performanceの直後");

  const performs : PerformanceWithActs[] = (performances ?? []) as any[];
  const list = performs.filter(p => p.act_id === actId)
  // ランク優先（offeredを一番上に出す）
  list.sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return (a.event_date ?? "").localeCompare(b.event_date ?? "");
  });

  const top = list[0] ?? null;

  // event_title を表示したいなら events から引く（1件だけなので追加クエリでOK）
  let eventTitle: string | null = null;
  if (top?.event_id) {
    console.log("getEventByIdの直前");
    const ev: EventRow | null = await getEventById(top.event_id) as EventRow;
    eventTitle = ev?.title ?? null;
  }

  const nextPerformance =
    top
      ? ({
        id: top.id,
        profile_id: myAct?.owner_profile_id || "",
        act_id: myAct.id,
        act_name: "",
        event_id: top.event_id,
        venue_id: null,
        memo: null,
        details: null,
        flyer_url: null,
        status: top.status,
        status_changed_at: null,
        status_reason: null,    
        booking_id: top.booking_id,
        created_at: top.created_at,
        offer_id: top.offer_id,
        open_time: top.open_time,
        start_time: top.start_time,
          event_date: top.event_date,
          venue_name: top.venue_name,
          event_title: eventTitle,
        } satisfies PerformanceRow)
      : null
  ;
        

  // songs (max 20) : act_songs の構造に合わせて調整
  const songs = await getMySongs(actId);

  // membership (owner でも取れるが、owner の場合は判定に使わないのでOK)
  const user = await getCurrentUser();
  const memberAct = (await getMyMemberActs()).find(a => a.id === myAct.id);
  const judgeAdmin = (a : ActRow) => !!(a && user?.id && a.owner_profile_id === user?.id);
  const member = { act_id: memberAct?.id, is_admin: judgeAdmin(myAct), status: "active" } as MemberRow;
 
  return <ActDetailClient
    user={user}
    act={{ ...myAct }}
    performances={performances}
    nextPerformance={nextPerformance}
    songs={songs}
    member={member}
    />;
}
