export type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
};
export type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
  owner_profile_id: string;
  is_temporary: boolean;
  description: string | null;
  icon_url: string | null;
  photo_url: string | null;
  profile_link_url: string | null;
};

export function typeLabel(t: string | null): string {
  if (!t) return "種別未設定";
  if (t === "solo") return "ソロ";
  if (t === "band") return "バンド";
  if (t === "duo") return "デュオ";
  if (t === "unit") return "ユニット";
  return t;
}

export type { DetailsRow } from "./performance";

export type AttachmentRow = {
  id: string;
  file_url: string;
  file_path: string | null;
  file_type: string;
  caption: string | null;
  created_at: string;
  performance_id: string;
};

export type MessageRow = {
    id: string;
    body: string;
    source: string | null;
    created_at: string;
};
export function normalizeAct(a: ActRow | ActRow[] | null): ActRow | null {
  if (!a) return null;
  return Array.isArray(a) ? a[0] ?? null : a;
}
