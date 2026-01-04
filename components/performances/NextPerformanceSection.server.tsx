// components/performances/NextPerformanceSection.server.tsx
import { toYmdLocal } from "@/lib/utils/date";
import {
  getMyActsServer,
  getNextPerformanceServer,
  // getFlyerMapForPerformancesServer,
  // getDetailsMapForPerformancesServer,
  // ensureAndFetchPrepMapServer,
} from "@/lib/performanceQueries.server";
import { NextPerformanceSectionClient } from "./NextPerformanceSectionClient";

export async function NextPerformanceSectionServer() {
  const todayStr = toYmdLocal();

  const { userId } = await getMyActsServer();
  const next = await getNextPerformanceServer(todayStr);

  if (!next) {
    // 表示しない方針ならnullでOK
    return null;
  }

  const ids = [next.id];

  // ※あなたの既存関数に合わせて server 版を用意してここで呼ぶ
  // const [flyers, dets, preps] = await Promise.all([
  //   getFlyerMapForPerformancesServer(ids),
  //   getDetailsMapForPerformancesServer(ids),
  //   ensureAndFetchPrepMapServer({ performances: [{ id: next.id, event_date: next.event_date, act_id: next.act_id }] }),
  // ]);

  return (
    <NextPerformanceSectionClient
      todayStr={todayStr}
      initialUserId={userId}
      initialPerformance={next}
      initialFlyer={null}
      initialDetails={null}
      initialPrepMap={{}}
    />
  );
}
