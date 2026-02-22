/** 共通フォーマッタ */

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** "2026-03-15" → "2026/03/15（土）" */
export function fmtDateWithDay(ymd: string | null | undefined): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const day = DAY_NAMES[date.getDay()];
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}（${day}）`;
}

/** "18:30:00" or "18:30" → "18:30" */
export function fmtTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.slice(0, 5);
}

/** 1500 → "¥1,500" */
export function fmtCharge(yen: number | null | undefined): string {
  if (yen == null) return "";
  return `¥${yen.toLocaleString("ja-JP")}`;
}

/** ハッシュタグ用に空白を除去 */
export function normalizeHashtag(name: string): string {
  return name.replace(/\s+/g, "");
}
