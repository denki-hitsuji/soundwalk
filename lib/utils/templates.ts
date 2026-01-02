// lib/templates.ts
import { toYmdLocal } from "@/lib/utils/date";

export function makeSongMemoTemplate() {
  const today = toYmdLocal();
  return [
    "【⚠ 要注意】",
    "- ",
    "",
    "【構成メモ】",
    "- ",
    "",
    "【前回の反省 / 今日の課題】",
    "- ",
    "",
    "【更新日】",
    `- ${today}`,
    "",
  ].join("\n");
}

export function makePracticeLogTemplate(studioName?: string) {
  const today = toYmdLocal();
  const place = studioName ? `（${studioName}）` : "";
  return [
    `【練習ログ ${today}${place}】`,
    "",
    "【今日やったこと】",
    "- ",
    "",
    "【詰まった箇所 / ミス】",
    "- ",
    "",
    "【次回やる】",
    "- ",
    "",
  ].join("\n");
}
