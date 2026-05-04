"use server";
import {
  getRehearsalsForActDb,
  getRehearsalsForPerformanceDb,
  getRehearsalsInRangeDb,
} from "@/lib/db/rehearsals";
import { RehearsalRow } from "@/lib/utils/rehearsals";

export async function getRehearsalsForAct(actId: string): Promise<RehearsalRow[]> {
  return getRehearsalsForActDb(actId);
}

export async function getRehearsalsForPerformance(
  performanceId: string,
  actId: string,
  eventDate: string
): Promise<RehearsalRow[]> {
  return getRehearsalsForPerformanceDb(performanceId, actId, eventDate);
}

export async function getRehearsalsInRange(params: {
  startDate: string;
  endDate: string;
}): Promise<RehearsalRow[]> {
  return getRehearsalsInRangeDb(params);
}
