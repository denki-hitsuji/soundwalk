"use server"
import { getDetailsForPerformanceDb, getDetailsMapForPerformancesDb, getFlyerMapForPerformancesDb, getPerformanceAttachmentsDb, getPerformanceByIdDb, getPerformanceMessagesDb } from "@/lib/db/performances";
import { toPerformanceWithActsPlain, DetailsMap } from "../utils/performance";
import { getMyUpcomingPerformancesDb } from "@/lib/db/performances";
export type { PerformanceRow, PerformanceWithActs } from "@/lib/db/performances";

export async function getMyUpcomingPerformances(todayStr:string) {
    const data = await getMyUpcomingPerformancesDb(todayStr);    
    return data.map(d => toPerformanceWithActsPlain(d));
}
export async function getFlyerMapForPerformances(performanceIds: string[]) {
      return await getFlyerMapForPerformancesDb(performanceIds);
}
export async function getDetailsMapForPerformances(performanceIds: string[]): Promise<DetailsMap> {
      return await getDetailsMapForPerformancesDb(performanceIds);
}


export async function getPerformanceAttachments(params: { performanceId: string }) {
  return await getPerformanceAttachmentsDb(params);
}
export async function getPerformanceMessages(params: { performanceId: string }) {
  return await getPerformanceMessagesDb(params);
}
export async function getDetailsMapForPerformance(performanceId: string): Promise<DetailsMap> {
  return await getDetailsMapForPerformances([performanceId]);
}

export async function getMyPerformanceById(params: {performanceId : string}) {
   return await getPerformanceByIdDb(params);
}

export async function getDetailsForPerformance(params: { performanceId: string }) {
      return await getDetailsForPerformanceDb(params);
}
