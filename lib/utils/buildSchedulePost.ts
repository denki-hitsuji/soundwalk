import { fmtDateWithDay, fmtTime, normalizeHashtag } from "@/lib/utils/format";

type PerformanceForSchedule = {
  event_date: string;
  venue_name: string | null;
  open_time: string | null;
  start_time: string | null;
  event_title: string | null;
  act_name: string | null;
};

/**
 * ミュージシャンの「これからのライブ」をまとめた告知文を生成する。
 * 日付昇順で並ぶ前提。
 */
export function buildSchedulePost(params: {
  performances: PerformanceForSchedule[];
  profileName: string;
}) {
  const { performances, profileName } = params;

  const lines: string[] = [];

  // ヘッダー（プロフィール名）
  lines.push(profileName || "【ライブスケジュール】");
  lines.push("");

  for (const p of performances) {
    const date = fmtDateWithDay(p.event_date);
    lines.push(`■ ${date}`);

    // アクト名
    if (p.act_name) lines.push(p.act_name);

    // [企画名(あれば)] @ [会場名]
    const venueParts = [p.event_title, p.venue_name ? `@ ${p.venue_name}` : ""].filter(Boolean);
    if (venueParts.length) lines.push(venueParts.join(" "));

    // OPEN / START
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
  if (profileName) tags.push(`#${normalizeHashtag(profileName)}`);
  tags.push("#ライブ");
  tags.push("#soundwalk");
  lines.push(tags.join(" "));

  return lines.join("\n");
}
