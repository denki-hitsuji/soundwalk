"use server"
import { deletePerformanceMemoDb, ensureAndFetchPrepMapDb, updatePerformanceMemoDb, updatePrepTaskDoneDb, upsertPerformanceDb, upsertPerformanceDetailsDb } from "../db/performances";

export async function updatePrepTaskDone(params: { taskId: string; nextDone: boolean; userId: string | null; }) {
    return await updatePrepTaskDoneDb(params);
}

export async function ensureAppFetchPrepMap(params: {
  performances: Array<{ id: string; event_date: string; act_id: string | null }>;
}) {
    return await ensureAndFetchPrepMapDb(params);
}
export async function upsertPerformance(params: {
    id: string | null;
    profile_id: string;
    event_date: string;
    venue_name: string | null;
    memo: string | null;
    act_id: string | null;
}): Promise<string> { 
    return await upsertPerformanceDb(params);
}

export async function updatePerformanceMemo(params: {
    performanceId: string;
    newMemo: string | null;
}): Promise<void> {
      return await updatePerformanceMemoDb(params);
}

export async function deletePerformanceMemo(performanceId: string): Promise<void> {
      return await deletePerformanceMemoDb(performanceId);
}

export async function upsertPerformanceDetails(params: {
    performanceId: string;
    notes: string | null;
}): Promise<void> { 
  return await upsertPerformanceDetailsDb(params);
}