// components/performances/NextPerformanceSectionClient.tsx
"use client";

import { useMemo, useState } from "react";
import { DashboardPerformanceCard } from "@/components/performances/DashboardPerformanceCard";
import { type PrepMap } from "@/lib/utils/performance";
import { updatePrepTaskDoneDb } from "@/lib/db/performanceActions";
import { parseYmdLocal } from "@/lib/utils/date";

export function NextPerformanceSectionClient(props: {
  todayStr: string;
  initialUserId: string | null;
  initialPerformance: any | null;
  initialFlyer: any | null;
  initialDetails: any | null;
  initialPrepMap: PrepMap;
}) {
  const todayDate = useMemo(() => parseYmdLocal(props.todayStr), [props.todayStr]);

  const [userId] = useState(props.initialUserId);
  const [p] = useState<any | null>(props.initialPerformance);
  const [flyer] = useState<any | null>(props.initialFlyer);
  const [details] = useState<any | null>(props.initialDetails);
  const [prepByPerformanceId, setPrepByPerformanceId] = useState<PrepMap>(props.initialPrepMap);

  const toggleDone = async (performanceId: string, taskKey: string) => {
    const row = prepByPerformanceId[performanceId]?.[taskKey];
    if (!row) return;

    try {
      const updated = await updatePrepTaskDoneDb({
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
