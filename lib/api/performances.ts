"use server"
import { getDetailsForPerformanceDb, getDetailsMapForPerformancesDb, getFlyerMapForPerformancesDb, getNextPerformanceDb, getPerformanceAttachmentsDb, getPerformanceByIdDb, getPerformanceMessagesDb, getPerformancesForDashboardDb } from "@/lib/db/performances";
import { toPlainPerformance, toPerformanceWithActsPlain, DetailsMap, getPerformances } from "../utils/performance";
import { getMyUpcomingPerformancesDb } from "@/lib/db/performances";
export type { PerformanceRow, PerformanceWithActs } from "@/lib/db/performances";

export async function getMyUpcomingPerformances(todayStr:string) {
    const data = await getMyUpcomingPerformancesDb(todayStr);    
    return data.map(d => toPerformanceWithActsPlain(d));
}
export async function getPerformancesForDashboard(userId: string) {
    const data = await getPerformancesForDashboardDb(userId);
    return toPlainPerformance(data);
}

export async function getNextPerformance(todayStr?: string) {
      return await getNextPerformanceDb(todayStr);
}
export async function getFlyerMapForPerformances(performanceIds: string[]) {
      return await getFlyerMapForPerformancesDb(performanceIds);
}
export async function getDetailsMapForPerformances(performanceIds: string[]): Promise<DetailsMap> {
      return await getDetailsMapForPerformancesDb(performanceIds);
}


export async function getNextPerformanceServer(todayStr?: string) {
 
  return 
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
