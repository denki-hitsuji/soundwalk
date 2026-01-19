// lib/share/buildPerformancePost.ts
import type { PerformanceRow } from "@/lib/utils/performance";
import type { ActRow, AttachmentRow, DetailsRow } from "@/lib/utils/acts";
import type { EventRow } from "@/lib/utils/events";

function ymdToSlash(ymd: string | null | undefined) {
  if (!ymd) return "";
  return ymd.replaceAll("-", "/");
}

function fmtTime(t: string | null | undefined) {
  // "18:30" or "18:30:00" -> "18:30"
  if (!t) return "";
  return t.slice(0, 5);
}

function firstNonEmptyLine(s: string | null | undefined) {
  const text = (s ?? "").trim();
  if (!text) return "";
  const line = text.split("\n").map((x) => x.trim()).find((x) => x.length > 0);
  return line ?? "";
}

function normalizeHashtag(name: string) {
  // ハッシュタグにしやすいように空白等を削る（日本語はそのままでもOK）
  return name.replace(/\s+/g, "");
}

export function buildPerformancePost(params: {
  performance: PerformanceRow;
  act: ActRow | null;
  event: EventRow | null;
  details: DetailsRow | null;
  attachments: AttachmentRow[];
  // 任意：外部に貼るURL（将来）
  publicUrl?: string | null;
}) {
  const { performance, act, event, details, attachments, publicUrl } = params;

  const date = ymdToSlash(performance.event_date);
  const venue = performance.venue_name ?? "";
  const open = fmtTime(performance.open_time);
  const start = fmtTime(performance.start_time);

  const charge =
    details?.customer_charge_yen != null ? `${details.customer_charge_yen}円` : "";

  const flyerUrl = attachments?.[0]?.file_url ?? "";

  const headline = event?.title?.trim()
    ? `【ライブ告知】${event.title.trim()}`
    : "【ライブ告知】";

  const actName = act?.name?.trim() ? act.name.trim() : "";

  // memoは「最初の1行だけ」採用（長文を暴発させない）
//   const oneLine = firstNonEmptyLine(performance.);

  const lines: string[] = [];
  lines.push(headline);

  const line2Parts = [date, venue].filter(Boolean);
  if (line2Parts.length) lines.push(line2Parts.join(" "));

  const timeParts = [
    open ? `OPEN ${open}` : "",
    start ? `START ${start}` : "",
  ].filter(Boolean);
  if (timeParts.length) lines.push(timeParts.join(" / "));

  if (charge) lines.push(`CHARGE ${charge}`);
  if (actName) lines.push(actName);
//   if (oneLine) lines.push(oneLine);

  if (flyerUrl) lines.push(`フライヤー: ${flyerUrl}`);
  if (publicUrl) lines.push(`詳細: ${publicUrl}`);

  // ハッシュタグ（控えめ）
  const tags: string[] = [];
  if (actName) tags.push(`#${normalizeHashtag(actName)}`);
  tags.push("#ライブ");
  tags.push("#soundwalk");
  lines.push(tags.join(" "));

  return lines.filter(Boolean).join("\n");
}
