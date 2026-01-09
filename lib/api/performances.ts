"use server"
import { getDetailsMapForPerformancesDb, getFlyerMapForPerformancesDb, getNextPerformanceDb, getPerformancesForDashboardDb } from "@/lib/db/performances";
import { toPlainPerformance, toPerformanceWithActsPlain, DetailsMap } from "../utils/performance";
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
