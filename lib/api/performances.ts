"use server"
import { ensureAndFetchPrepMapDb, getPerformancesForDashboardDb } from "@/lib/db/performances";
import { toPlainPerformance } from "../utils/performance";
import { getMyUpcomingPerformancesDb } from "@/lib/db/performances";
export type { PerformanceRow, PerformanceWithActs } from "@/lib/db/performances";
import { updatePrepTaskDoneDb } from "../db/performanceActions";
export async function updatePrepTaskDone(params: { taskId: string; nextDone: boolean; userId: string | null; }) {
    return await updatePrepTaskDoneDb(params);
}
export async function getMyUpcomingPerformances(todayStr:string) {
    const data = await getMyUpcomingPerformancesDb(todayStr);    
    return data.map(d => toPlainPerformance(d));
}
export async function getPerformancesForDashboard(userId: string) {
    const data = await getPerformancesForDashboardDb(userId);
    return toPlainPerformance(data);
}

export async function ensureAppFetchPrepMap(params: {
  performances: Array<{ id: string; event_date: string; act_id: string | null }>;
}) {
    return await ensureAndFetchPrepMapDb(params);
}