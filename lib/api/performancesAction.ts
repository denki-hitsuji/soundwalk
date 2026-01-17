"use server"
import { revalidatePath } from "next/cache";
import { acceptOfferDb, deletePerformanceAttachmentDb, deletePerformanceMemoDb, deletePersonalPerformanceDb, ensureAndFetchPrepMapDb, postPerformanceMessageDb, savePerformanceDetailsFullDb, updatePerformanceMemoDb, updatePrepTaskDoneDb, uploadPerformanceFlyerDb, upsertPerformanceDb, upsertPerformanceDetailsDb, withdrawFromEventDb } from "../db/performances";
import { redirect } from "next/navigation";

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
  console.log(`upsert start`);
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

const BUCKET = "performance-attachments";

export async function savePerformanceDetailsFullAction(params: {
    performanceId: string;
    load_in_time: string | null;
    set_start_time: string | null;
    set_end_time: string | null;
    set_minutes: number | null;
    customer_charge_yen: number | null;
    one_drink_required: boolean | null;
    notes: string | null;
    open_time: string | null;
    start_time: string | null;
}) {
    return await savePerformanceDetailsFullDb(params);
}

export async function postPerformanceMessageAction(params: {
  performanceId: string;
  body: string;
  source: string | null;
}) {
    return await postPerformanceMessageDb(params);
}

export async function uploadPerformanceFlyerAction(formData: FormData) {
    return await uploadPerformanceFlyerDb(formData);
}

export async function deletePerformanceAttachmentAction(params: {
  performanceId: string;
  attachmentId: string;
}) {
    return await deletePerformanceAttachmentDb(params);
}

export async function acceptOfferAction(params: {
  performanceId: string;
  eventId: string;
  actId: string;
}) {
    return await acceptOfferDb(params);
}

export async function withdrawFromEventAction(params: {
  performanceId: string;
  eventId: string;
}) {
    return await withdrawFromEventDb(params);
}

export async function deletePersonalPerformanceAction(params: { performanceId: string }) {
    await deletePersonalPerformanceDb(params);
    revalidatePath("/musician/performances");

    // 遷移をサーバー側で確定
    redirect("/musician/performances")
}
