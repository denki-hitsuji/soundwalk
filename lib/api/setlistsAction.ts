// lib/api/setlistsAction.ts
"use server";

import { revalidatePath } from "next/cache";
import {
  createSetlistDb,
  addSetlistItemDb,
  deleteSetlistItemDb,
  reorderSetlistItemsDb,
  updateSetlistItemDb,
  getSetlistByPerformanceIdDb,
  getSetlistItemsDb,
} from "@/lib/db/setlists";
import type { SetlistRow, SetlistItemView } from "@/lib/utils/setlist";

// Queries (exported for use in pages)
export async function getSetlistByPerformanceId(
  performanceId: string
): Promise<SetlistRow | null> {
  return await getSetlistByPerformanceIdDb(performanceId);
}

export async function getSetlistItems(
  setlistId: string
): Promise<SetlistItemView[]> {
  return await getSetlistItemsDb(setlistId);
}

// Mutations (Server Actions)
export async function createSetlistAction(performanceId: string) {
  const result = await createSetlistDb(performanceId);
  revalidatePath(`/musician/performances/${performanceId}`);
  return result;
}

export async function addSetlistItemAction(params: {
  setlistId: string;
  performanceId: string;
  songId?: string | null;
  title?: string | null;
  memo?: string | null;
}) {
  const result = await addSetlistItemDb({
    setlistId: params.setlistId,
    songId: params.songId,
    title: params.title,
    memo: params.memo,
  });
  revalidatePath(`/musician/performances/${params.performanceId}`);
  return result;
}

export async function deleteSetlistItemAction(params: {
  itemId: string;
  performanceId: string;
}) {
  await deleteSetlistItemDb(params.itemId);
  revalidatePath(`/musician/performances/${params.performanceId}`);
}

export async function reorderSetlistItemsAction(params: {
  setlistId: string;
  performanceId: string;
  orderedItemIds: string[];
}) {
  await reorderSetlistItemsDb({
    setlistId: params.setlistId,
    orderedItemIds: params.orderedItemIds,
  });
  revalidatePath(`/musician/performances/${params.performanceId}`);
}

export async function updateSetlistItemAction(params: {
  itemId: string;
  performanceId: string;
  memo?: string | null;
  title?: string | null;
}) {
  await updateSetlistItemDb({
    itemId: params.itemId,
    memo: params.memo,
    title: params.title,
  });
  revalidatePath(`/musician/performances/${params.performanceId}`);
}
