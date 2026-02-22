import type { PerformanceRow } from "@/lib/utils/performance";
import type { ActRow } from "@/lib/utils/acts";
import { fmtDateWithDay, fmtTime, normalizeHashtag } from "@/lib/utils/format";

type PerformanceForSchedule = Pick<
  PerformanceRow,
  "event_date" | "venue_name" | "open_time" | "start_time" | "event_title"
>;

/**
 * ミュージシャンの「これからのライブ」をまとめた告知文を生成する。
 * 日付昇順で並ぶ前提。
 */
export function buildSchedulePost(params: {
  performances: PerformanceForSchedule[];
  act: ActRow | null;
}) {
  const { performances, act } = params;

  const actName = act?.name?.trim() ?? "";
  const lines: string[] = [];

  // ヘッダー
  lines.push(actName ? `【ライブスケジュール】${actName}` : "【ライブスケジュール】");
  lines.push("");

  for (const p of performances) {
    const date = fmtDateWithDay(p.event_date);
    lines.push(`■ ${date}`);
    if (p.event_title) lines.push(p.event_title);

    const venue = p.venue_name;
    if (venue) lines.push(`@ ${venue}`);

    const open = fmtTime(p.open_time);
    const start = fmtTime(p.start_time);
    const timeParts = [
      open ? `OPEN ${open}` : "",
      start ? `START ${start}` : "",
    ].filter(Boolean);
    if (timeParts.length) lines.push(timeParts.join(" / "));

    lines.push("");
  }

  // ハッシュタグ
  const tags: string[] = [];
  if (actName) tags.push(`#${normalizeHashtag(actName)}`);
  tags.push("#ライブ");
  tags.push("#soundwalk");
  lines.push(tags.join(" "));

  return lines.join("\n");
}
