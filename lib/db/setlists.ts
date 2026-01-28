// lib/db/setlists.ts
"use server";
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SetlistRow, SetlistItemRow, SetlistItemView } from "@/lib/utils/setlist";

export async function getSetlistByPerformanceIdDb(
  performanceId: string
): Promise<SetlistRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("setlists")
    .select("*")
    .eq("performance_id", performanceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getSetlistItemsDb(
  setlistId: string
): Promise<SetlistItemView[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("v_my_setlist_items")
    .select("*")
    .eq("setlist_id", setlistId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SetlistItemView[];
}

export async function createSetlistDb(
  performanceId: string
): Promise<SetlistRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("setlists")
    .insert({ performance_id: performanceId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function addSetlistItemDb(params: {
  setlistId: string;
  songId?: string | null;
  title?: string | null;
  memo?: string | null;
  durationSec?: number | null;
}): Promise<SetlistItemRow> {
  const supabase = await createSupabaseServerClient();

  // Get max sort_order
  const { data: maxData } = await supabase
    .from("setlist_items")
    .select("sort_order")
    .eq("setlist_id", params.setlistId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxData?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("setlist_items")
    .insert({
      setlist_id: params.setlistId,
      sort_order: nextOrder,
      song_id: params.songId ?? null,
      title: params.title ?? null,
      memo: params.memo ?? null,
      duration_sec: params.durationSec ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSetlistItemDb(itemId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("setlist_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

export async function reorderSetlistItemsDb(params: {
  setlistId: string;
  orderedItemIds: string[];
}): Promise<void> {
  const supabase = await createSupabaseServerClient();

  // Temporarily set sort_order to negative values to avoid unique constraint violation
  // Then update to final values
  for (let i = 0; i < params.orderedItemIds.length; i++) {
    const { error } = await supabase
      .from("setlist_items")
      .update({ sort_order: -(i + 1) })
      .eq("id", params.orderedItemIds[i])
      .eq("setlist_id", params.setlistId);

    if (error) throw new Error(error.message);
  }

  // Now set to positive values
  for (let i = 0; i < params.orderedItemIds.length; i++) {
    const { error } = await supabase
      .from("setlist_items")
      .update({ sort_order: i + 1 })
      .eq("id", params.orderedItemIds[i])
      .eq("setlist_id", params.setlistId);

    if (error) throw new Error(error.message);
  }
}

export async function updateSetlistItemDb(params: {
  itemId: string;
  memo?: string | null;
  durationSec?: number | null;
  title?: string | null;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const patch: Record<string, unknown> = {};
  if (params.memo !== undefined) patch.memo = params.memo;
  if (params.durationSec !== undefined) patch.duration_sec = params.durationSec;
  if (params.title !== undefined) patch.title = params.title;

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase
    .from("setlist_items")
    .update(patch)
    .eq("id", params.itemId);

  if (error) throw new Error(error.message);
}
