"use server";
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RehearsalRow } from "@/lib/utils/rehearsals";

export async function getRehearsalsForActDb(actId: string): Promise<RehearsalRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rehearsals")
    .select("*")
    .eq("act_id", actId)
    .order("rehearsal_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRehearsalsForPerformanceDb(
  performanceId: string,
  actId: string,
  eventDate: string
): Promise<RehearsalRow[]> {
  const supabase = await createSupabaseServerClient();

  // (1) 明示リンクされたリハ
  const { data: linked, error: e1 } = await supabase
    .from("rehearsals")
    .select("*")
    .eq("performance_id", performanceId);

  if (e1) throw new Error(e1.message);

  // (2) 日付範囲マッチ（イベント日の30日前〜当日、同じact、未リンク）
  const base = new Date(eventDate);
  base.setDate(base.getDate() - 30);
  const startDate = base.toISOString().split("T")[0];

  const { data: dateMatched, error: e2 } = await supabase
    .from("rehearsals")
    .select("*")
    .eq("act_id", actId)
    .is("performance_id", null)
    .gte("rehearsal_date", startDate)
    .lte("rehearsal_date", eventDate);

  if (e2) throw new Error(e2.message);

  // UNION + 重複排除 + 降順
  const seen = new Set<string>();
  const all = [...(linked ?? []), ...(dateMatched ?? [])].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return all.sort((a, b) => b.rehearsal_date.localeCompare(a.rehearsal_date));
}

export async function getRehearsalsInRangeDb(params: {
  startDate: string;
  endDate: string;
}): Promise<RehearsalRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rehearsals")
    .select("*")
    .gte("rehearsal_date", params.startDate)
    .lte("rehearsal_date", params.endDate)
    .order("rehearsal_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addRehearsalDb(params: {
  act_id: string;
  rehearsal_date: string;
  start_time?: string | null;
  end_time?: string | null;
  studio_name?: string | null;
  memo?: string | null;
  performance_id?: string | null;
}): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("ログインが必要です");

  const { error } = await supabase.from("rehearsals").insert({
    act_id: params.act_id,
    rehearsal_date: params.rehearsal_date,
    start_time: params.start_time ?? null,
    end_time: params.end_time ?? null,
    studio_name: params.studio_name ?? null,
    memo: params.memo ?? null,
    performance_id: params.performance_id ?? null,
    created_by_profile_id: user.id,
  });

  if (error) throw new Error(error.message);
}

export async function deleteRehearsalDb(rehearsalId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("ログインが必要です");

  const { error } = await supabase
    .from("rehearsals")
    .delete()
    .eq("id", rehearsalId)
    .eq("created_by_profile_id", user.id);

  if (error) throw new Error(error.message);
}
