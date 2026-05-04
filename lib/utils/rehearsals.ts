export type RehearsalRow = {
  id: string;
  act_id: string;
  rehearsal_date: string;       // YYYY-MM-DD
  start_time: string | null;    // "HH:MM"
  end_time: string | null;
  studio_name: string | null;
  memo: string | null;
  performance_id: string | null;
  created_by_profile_id: string;
  created_at: string;
};

function trimSeconds(t: string): string {
  return t.slice(0, 5);
}

export function formatRehearsalTime(
  start_time: string | null,
  end_time: string | null
): string {
  const s = start_time ? trimSeconds(start_time) : null;
  const e = end_time ? trimSeconds(end_time) : null;
  if (!s && !e) return "";
  if (s && e) return `${s}〜${e}`;
  if (s) return `${s}〜`;
  return `〜${e}`;
}
