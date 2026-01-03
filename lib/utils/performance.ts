// lib/performanceUtils.ts

import { ActRow } from "@/lib/db/acts"
import { diffDays } from "@/lib/utils/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PerformanceRow = {
  id: string;
  profile_id: string;
  act_id: string | null;
  act_name: string | null;
  event_id: string | null;
  venue_id: string | null;
  event_date: string;
  venue_name: string | null;
  memo: string | null;
  details: DetailsRow | null;
  flyer_url: string | null;
  event_title: string | null;

  status: string | null;             // ★追加
  status_reason: string | null;      // ★追加
  status_changed_at: string | null;  // ★追加
};

export type PerformanceWithActs = PerformanceRow & {
  // join が単体/配列で揺れるのに両対応
  acts: ActRow | ActRow[] | null;
};

export type FlyerRow = {
  performance_id: string;
  file_url: string;
  created_at: string;
};

export type FlyerMap = Record<string, { file_url: string; created_at: string }>;

export type DetailsRow = {
  performance_id: string;
  load_in_time: string | null;
  set_start_time: string | null;
  set_end_time: string | null;
  set_minutes: number | null;
  customer_charge_yen: number | null;
  one_drink_required: boolean | null;
};
export type DetailsMap = Record<string, DetailsRow>;

export type PrepTaskRow = {
  id: string;
  performance_id: string;
  task_key: string;
  act_id: string | null;
  due_date: string; // YYYY-MM-DD
  is_done: boolean;
  done_at: string | null;
  done_by_profile_id: string | null;
};
export type PrepMap = Record<string, Record<string, PrepTaskRow>>;

export function padTimeHHMM(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5);
}

export function detailsSummary(d?: DetailsRow) {
  if (!d) return "未登録（入り/出番/チャージ）";

  const loadIn = padTimeHHMM(d.load_in_time);
  const start = padTimeHHMM(d.set_start_time);
  const end = padTimeHHMM(d.set_end_time);
  const minutes = d.set_minutes ?? null;
  const charge = d.customer_charge_yen ?? null;
  const oneDrink = d.one_drink_required;

  const parts: string[] = [];
  if (loadIn) parts.push(`入り ${loadIn}`);
  if (start && end) parts.push(`出番 ${start}-${end}`);
  else if (start) parts.push(`出番 ${start}`);
  if (minutes !== null) parts.push(`${minutes}分`);
  if (charge !== null) parts.push(`¥${charge.toLocaleString()}`);
  if (oneDrink === true) parts.push("1Dあり");
  if (oneDrink === false) parts.push("1Dなし");

  return parts.length > 0 ? parts.join(" / ") : "未登録（入り/出番/チャージ）";
}

export function statusText(target: Date, today: Date) {
  const dd = diffDays(target, today);
  if (dd < 0) return "期限超過";
  if (dd === 0) return "今日";
  return `あと${dd}日`;
}

export const PREP_DEFS = [
  { key: "announce_2w", label: "告知（2週前）", offsetDays: -14 },
  { key: "announce_1w", label: "告知（1週前）", offsetDays: -7 },
  { key: "announce_1d", label: "告知（前日）", offsetDays: -1 },
] as const;

export type PrepDef = (typeof PREP_DEFS)[number];

export function normalizeAct(p: PerformanceWithActs): ActRow | null {
  const a = p.acts;
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}

export async function getPerformances(): Promise<{ data: PerformanceWithActs[]; error: any }> {
  // 1) ライブ一覧（acts も一緒）
  const { data, error } = await (await createSupabaseServerClient())
    .from("v_my_performances")
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
        created_at,
        profile_id,
        event_id,
        venue_id,
        details:performance_details (
          performance_id,
          load_in_time,
          set_start_time,
          set_end_time,
          set_minutes,
          customer_charge_yen,
          one_drink_required
        ),
        attachments:performance_attachments (
          performance_id,
          file_url,
          created_at
        ),
        acts:acts (
          id,
          name,
          act_type,
          owner_profile_id,
          is_temporary,
          description,
          icon_url,
          photo_url,
          profile_link_url
        ),
        events:events (
          title
        )
      `
    )
    .not("acts", "is", null) // act.name が null の行を除外
    .order("event_date", { ascending: false });
  if (error) throw error;
  const normalizedData = data.map((p) => {
    // Normalize details: take the first element if it's an array, or null if missing
    const details = Array.isArray(p.details) ? (p.details[0] ?? null) : (p.details ?? null);

   const toActRow = (a: any): ActRow => ({
  id: a.id,
  name: a.name,
  act_type: a.act_type,
  owner_profile_id: a.owner_profile_id ?? null,
  is_temporary: a.is_temporary ?? null,
  description: a.description ?? null,
  icon_url: a.icon_url ?? null,
  photo_url: a.photo_url ?? null,
  profile_link_url: a.profile_link_url ?? null,
});

// Normalize acts
let acts: ActRow | ActRow[] | null = null;
if (Array.isArray(p.acts)) {
  acts = p.acts.map(toActRow);
} else if (p.acts) {
  acts = toActRow(p.acts); // ← 単体を捨てない
}

    // Normalize event_title: take the first event's title if present
    const event_title = (p as any).events?.title ?? null;
    const act_name = Array.isArray(acts) ? (acts[0]?.name ?? null) : (acts?.name ?? null);
    const flyer_url =
      Array.isArray((p as any).attachments)
        ? ((p as any).attachments[0]?.file_url ?? null)
        : ((p as any).attachments?.file_url ?? null);

    // Return object matching PerformanceWithActs type
    return {
      ...p,
      details,
      acts,
      event_title,
      act_name,
      flyer_url,
    };
  });
  return { data: normalizedData, error };
}

export async function getFutureFlyers(flyerIds: string[]): Promise<{ data: FlyerRow[]; error: any }> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const { data, error } = await (await createSupabaseServerClient())
    .from("performance_attachments")
    .select("performance_id, file_url, created_at")
    .gt("event_date", todayStr)
    .order("event_date", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { data: data as FlyerRow[], error };
}