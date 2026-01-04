// lib/performanceQueries.server.ts
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toYmdLocal } from "@/lib/utils/date";

export type PerformanceWithActs = {
  id: string;
  event_date: string; // 文字列で持つ（Dateにしない）
  venue_name: string | null;
  memo: string | null;
  act_id: string;
  status: string | null;
  status_reason: string | null;
  status_changed_at: string | null;
  acts: { id: string; name: string; act_type: string | null }[] | null;
};

function toPlainError(e: unknown) {
  if (e instanceof Error) return { message: e.message, name: e.name };
  return { message: String(e), name: "UnknownError" };
}

export async function getMyActsServer() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw new Error(`auth.getUser failed: ${toPlainError(authErr).message}`);
  const userId = auth.user?.id;
  if (!userId) return { userId: null , actIds: [] as string[] };

  const { data, error } = await supabase.from("v_my_acts").select("id");
  if (error) throw new Error(`v_my_acts select failed: ${toPlainError(error).message}`);

  return { userId, actIds: (data ?? []).map((r: any) => String(r.id)) };
}

export async function getNextPerformanceServer(todayStr?: string) {
  const t = todayStr ?? toYmdLocal();
  const { actIds } = await getMyActsServer();
  if (actIds.length === 0) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("musician_performances")
    .select(
      `
      id,
      event_date,
      venue_name,
      memo,
      act_id,
      status,
      status_reason,
      status_changed_at,
      acts:acts ( id, name, act_type )
    `
    )
    .in("act_id", actIds)
    .gte("event_date", t)
    .neq("status", "canceled")
    .order("event_date", { ascending: true })
    .limit(1);

  if (error) throw new Error(`musician_performances select failed: ${toPlainError(error).message}`);

  // supabaseの返すdataは基本 plain object なのでOK。Date化しないのが大事。
  return (data?.[0] ?? null) as PerformanceWithActs | null;
}
