// app/venue/events/[eventId]/page.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EventPerformancesPanel } from "@/components/venue/EventPerformancesPanel";

type PageProps = {
  params: { eventId: string };
};

export default async function VenueEventPage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const eventId = params.eventId;

  // 認証（主催者判定に使う）
  const {
    data: { user },
  } = await (await createSupabaseServerClient()).auth.getUser();

  if (!user) {
    // 未ログインの扱いはプロジェクトの方針に合わせて
    notFound();
  }

  // event本体（必要カラムだけ）
  const { data: event, error: eventErr } = await (await createSupabaseServerClient())
    .from("events")
    .select(
      `
      id,
      date,
      venue_id,
      organizer_profile_id,
      max_artists,
      reconfirm_deadline
    `
    )
    .eq("id", eventId)
    .single();

  if (eventErr || !event) notFound();

  // 主催者チェック（ここで弾くのがUX的に親切）
  if (event.organizer_profile_id !== user.id) {
    notFound();
  }

  // venue（任意：表示用）
  const { data: venue } = event.venue_id
    ? await (await createSupabaseServerClient())
        .from("venues")
        .select("id,name")
        .eq("id", event.venue_id)
        .single()
    : { data: null };

  // 出演者一覧（event_id で紐付いているものだけ）
  // acts は name 等、profiles は display_name 等（あなたの実カラムに合わせて読み替え）
  const { data: performances, error: perfErr } = await (await createSupabaseServerClient())
    .from("musician_performances")
    .select(
      `
      id,
      profile_id,
      act_id,
      status,
      status_reason,
      status_changed_at,
      created_at,
      memo,
      acts ( id, name ),
      profiles ( id, display_name )
    `
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (perfErr) {
    // ここは状況に応じてエラーページでもOK
    throw new Error(perfErr.message);
  }

  const list = performances ?? [];

  const confirmed = list.filter((p) => p.status === "confirmed");
  const pending = list.filter((p) => p.status === "pending_reconfirm");
  const canceled = list.filter((p) => p.status === "canceled");

  const usedSlots = confirmed.length + pending.length;
  const maxArtists = event.max_artists ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-sm text-neutral-600">
          {venue?.name ?? "（会場未設定）"}
        </div>
        <h1 className="text-xl font-semibold">イベント詳細</h1>
        <div className="text-sm text-neutral-700">
          日時: {formatJaDateTime(event.date)}
        </div>
      </header>

      <section className="rounded-xl border p-4 space-y-2">
        <div className="font-semibold">枠</div>
        <div className="text-sm text-neutral-700">
          使用中: {usedSlots}
          {maxArtists !== null ? ` / ${maxArtists}` : ""}（確定: {confirmed.length}
          ／要再確認: {pending.length}／キャンセル: {canceled.length}）
        </div>
        {event.reconfirm_deadline && (
          <div className="text-sm text-neutral-700">
            再確認期限: {formatJaDateTime(event.reconfirm_deadline)}
          </div>
        )}
      </section>

      <EventPerformancesPanel
        eventId={eventId}
        maxArtists={maxArtists}
        confirmedCount={confirmed.length}
        pendingCount={pending.length}
        performances={list.map((p: any) => ({
          id: p.id,
          profile_id: p.profile_id,
          act_id: p.act_id,
          status: p.status,
          status_reason: p.status_reason,
          status_changed_at: p.status_changed_at,
          created_at: p.created_at,
          act_name: p.acts?.name ?? null,
          profile_name: p.profiles?.display_name ?? null,
          event_id: p.event_id,
          venue_id: p.venue_id,
          event_date: p.event_date,
          venue_name: p.venue_name,
          memo: p.memo,
          details: p.details,
          flyer_url: p.flyer?.file_url ?? null,
          event_title: p.event_title,
        }))}
      />
    </div>
  );
}

function formatJaDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
