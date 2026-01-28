// lib/utils/setlist.ts

export type SetlistRow = {
  id: string;
  performance_id: string;
  title: string | null;
  notes: string | null;
  created_at: string;
};

export type SetlistItemRow = {
  id: string;
  setlist_id: string;
  sort_order: number;
  song_id: string | null;
  title: string | null;
  duration_sec: number | null;
  memo: string | null;
  created_at: string;
};

// View: v_my_setlist_items
export type SetlistItemView = {
  performance_id: string;
  setlist_id: string;
  item_id: string;
  sort_order: number;
  display_title: string;
  song_id: string | null;
  custom_title: string | null;
  memo: string | null;
  duration_sec: number | null;
  created_at: string;
};
