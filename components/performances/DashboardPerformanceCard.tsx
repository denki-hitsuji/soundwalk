// components/performances/DashboardPerformanceCard.tsx
"use client";

import { PerformanceCard } from "@/components/performances/PerformanceCard";
import { toYmdLocal, parseYmdLocal, addDays, fmtMMdd } from "@/lib/utils/date";
import {
  PREP_DEFS,
  normalizeAct,
  detailsSummary,
  statusText,
} from "@/lib/performanceUtils";

export function DashboardPerformanceCard(props: {
  p: any;
  flyer?: any;
  details?: any;
  tasks?: any;
  todayDate: Date;
  onToggleDone: (performanceId: string, taskKey: string) => void | Promise<void>;
}) {
  return (
    <PerformanceCard
      p={props.p}
      flyer={props.flyer}
      details={props.details}
      tasks={props.tasks}
      prepDefs={PREP_DEFS}
      todayDate={props.todayDate}
      normalizeAct={normalizeAct}
      detailsSummary={detailsSummary}
      parseYmdLocal={parseYmdLocal}
      addDays={addDays}
      fmtMMdd={fmtMMdd}
      statusText={statusText}
      onToggleDone={props.onToggleDone}
    />
  );
}
