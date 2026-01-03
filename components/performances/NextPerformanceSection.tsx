// components/performances/NextPerformanceSection.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardPerformanceCard } from "@/components/performances/DashboardPerformanceCard";
import { type PrepMap } from "@/lib/utils/performance";
import { updatePrepTaskDone } from "@/lib/db/performanceWrites";
import {
  getNextPerformance,
  getFlyerMapForPerformances,
  getDetailsMapForPerformances,
  ensureAndFetchPrepMap,
} from "@/lib/db/performances";
import { toYmdLocal, parseYmdLocal, addDaysLocal, diffDaysLocal } from "@/lib/utils/date";
import { useCurrentUser } from "@/lib/auth/session.client";

export function NextPerformanceSection() {
  const todayStr = useMemo(() => toYmdLocal(), []);
  const todayDate = useMemo(() => parseYmdLocal(todayStr), [todayStr]);

  const [userId, setUserId] = useState<string | null>(null);
  const [p, setP] = useState<any | null>(null);
  const [flyer, setFlyer] = useState<any | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [prepByPerformanceId, setPrepByPerformanceId] = useState<PrepMap>({});

  useEffect(() => {
    const load = async () => {
      const user = await useCurrentUser();
      setUserId(user?.user?.id ?? null);

      const next = await getNextPerformance(todayStr);
      setP(next);

      if (!next) return;

      const ids = [next.id];

      const [flyers, dets, preps] = await Promise.all([
        getFlyerMapForPerformances(ids),
        getDetailsMapForPerformances(ids),
        ensureAndFetchPrepMap({
          performances: [{ id: next.id, event_date: next.event_date, act_id: next.act_id }],
        }),
      ]);

      setFlyer(flyers[next.id] ?? null);
      setDetails(dets[next.id] ?? null);
      setPrepByPerformanceId(preps);
    };

    void load();
  }, [todayStr]);

  const toggleDone = async (performanceId: string, taskKey: string) => {
    const row = prepByPerformanceId[performanceId]?.[taskKey];
    if (!row) return;

    try {
      const updated = await updatePrepTaskDone({
        taskId: row.id,
        nextDone: !row.is_done,
        userId,
      });

      setPrepByPerformanceId((prev) => ({
        ...prev,
        [updated.performance_id]: {
          ...(prev[updated.performance_id] ?? {}),
          [updated.task_key]: updated,
        },
      }));
    } catch (e) {
      console.error("prep update error", e);
    }
  };

  if (!p) return null;

  const tasks = prepByPerformanceId[p.id] ?? {};

  return (
    <section className="space-y-2">
      <div className="text-xs text-gray-500">次回のライブ</div>
      <DashboardPerformanceCard
        p={p}
        flyer={flyer}
        details={details}
        tasks={tasks}
        todayDate={todayDate}
        onToggleDone={toggleDone}
      />
    </section>
  );
}
