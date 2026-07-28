// lib/db/publicLives.ts
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type PublicLiveEvent = {
  title: string | null;
  date: string;
  open_time: string | null;
  start_time: string | null;
  venue: string;
  charge: number | null;
};

export type PublicActLives = {
  artist: {
    name: string;
    slug: string;
    photo_url: string | null;
    profile_link_url: string | null;
  };
  events: PublicLiveEvent[];
};

function toHm(time: string | null): string | null {
  if (!time) return null;
  return time.slice(0, 5);
}

// Supabaseの埋め込みselectは1:1関係でも単体/配列のどちらで返るか型上ゆれるため吸収する
function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/**
 * slug に紐づく公開アクトの今後のライブ情報を返す。
 * - is_public でないアクト、キャンセル済み公演、未確定（matched でない）企画は除外する。
 * - 対象アクトが存在しない/非公開の場合は null を返す（404判定は呼び出し側で行う）。
 */
export async function getPublicActLivesDb(
  slug: string,
  todayStr: string
): Promise<PublicActLives | null> {
  const supabase = createSupabaseServiceClient();

  const { data: page, error: pageError } = await supabase
    .from("act_public_pages")
    .select("act_id, acts:acts(id, name, photo_url, profile_link_url)")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (pageError) throw new Error(pageError.message);
  if (!page) return null;

  const act = one<any>((page as any).acts);
  if (!act) return null;

  const { data: rows, error: perfError } = await supabase
    .from("musician_performances")
    .select(
      `event_date, venue_name, open_time, start_time,
       details:performance_details(customer_charge_yen),
       events:events(title, charge, status)`
    )
    .eq("act_id", act.id)
    .neq("status", "canceled")
    .gte("event_date", todayStr)
    .order("event_date", { ascending: true });

  if (perfError) throw new Error(perfError.message);

  const events: PublicLiveEvent[] = (rows ?? [])
    .map((row: any) => ({
      row,
      event: one<any>(row.events),
      details: one<any>(row.details),
    }))
    // event_id が設定されている（＝企画に紐づく）場合は matched のみ公開。個人ライブはそのまま公開。
    .filter(({ event }) => !event || event.status === "matched")
    .map(({ row, event, details }) => ({
      title: event?.title ?? null,
      date: row.event_date as string,
      open_time: toHm(row.open_time),
      start_time: toHm(row.start_time),
      venue: row.venue_name as string,
      charge: event?.charge ?? details?.customer_charge_yen ?? null,
    }));

  return {
    artist: {
      name: act.name,
      slug,
      photo_url: act.photo_url ?? null,
      profile_link_url: act.profile_link_url ?? null,
    },
    events,
  };
}
