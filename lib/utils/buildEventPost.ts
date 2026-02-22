import type { EventRow } from "@/lib/utils/events";
import { fmtDateWithDay, fmtTime, fmtCharge, normalizeHashtag } from "@/lib/utils/format";

/**
 * イベント（企画）単位のSNS告知文を生成する。
 * 出演者一覧を含むフル告知文。
 */
export function buildEventPost(params: {
  event: EventRow;
  venueName: string;
  actNames: string[];
}) {
  const { event, venueName, actNames } = params;

  const lines: string[] = [];

  // ヘッダー
  const title = event.title?.trim() || "ライブ";
  lines.push(`【ライブ告知】${title}`);

  // 日時・会場
  const date = fmtDateWithDay(event.event_date);
  if (date || venueName) {
    lines.push([date, venueName ? `@ ${venueName}` : ""].filter(Boolean).join(" "));
  }

  // OPEN / START
  const open = fmtTime(event.open_time);
  const start = fmtTime(event.start_time);
  const timeParts = [
    open ? `OPEN ${open}` : "",
    start ? `START ${start}` : "",
  ].filter(Boolean);
  if (timeParts.length) lines.push(timeParts.join(" / "));

  // CHARGE
  const charge = fmtCharge(event.charge);
  if (charge) lines.push(`CHARGE ${charge}`);

  // 出演者
  if (actNames.length > 0) {
    lines.push("");
    lines.push("▼ 出演");
    for (const name of actNames) {
      lines.push(name);
    }
  }

  // ハッシュタグ
  lines.push("");
  const tags: string[] = [];
  if (title) tags.push(`#${normalizeHashtag(title)}`);
  tags.push("#ライブ");
  tags.push("#soundwalk");
  lines.push(tags.join(" "));

  return lines.join("\n");
}
