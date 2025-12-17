// lib/performanceUtils.ts

export type PerformanceRow = {
  id: string;
  event_date: string; // YYYY-MM-DD
  venue_name: string | null;
  memo: string | null;
  act_id: string | null;
};

export type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
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

export function parseLocalDate(yyyyMMdd: string) {
  return new Date(`${yyyyMMdd}T00:00:00`);
}

export function fmtMMdd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

export function addDays(date: Date, deltaDays: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

export function diffDays(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
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
