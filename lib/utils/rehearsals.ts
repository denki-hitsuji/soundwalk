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

export function formatRehearsalTime(
  start_time: string | null,
  end_time: string | null
): string {
  if (!start_time && !end_time) return "";
  if (start_time && end_time) return `${start_time}〜${end_time}`;
  if (start_time) return `${start_time}〜`;
  return `〜${end_time}`;
}
