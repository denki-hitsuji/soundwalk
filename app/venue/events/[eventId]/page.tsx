// app/venue/events/[eventId]/page.tsx
"use server"
import { notFound } from "next/navigation";
import { EventPerformancesPanel } from "@/components/venue/EventPerformancesPanel";
import { getCurrentUser } from "@/lib/auth/session.server";
import { getEventById } from "@/lib/api/events";
import { getVenueById } from "@/lib/api/venues";
import { getPerformances } from "@/lib/utils/performance";

export default async function VenueEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  // 認証（主催者判定に使う）
  // const user = await getCurrentUser();

  // if (!user) {
  //   // 未ログインの扱いはプロジェクトの方針に合わせて
  //   notFound();
  // }

  // event本体（必要カラムだけ）
  // const event = await getEventById(eventId);
  // // 主催者チェック（ここで弾くのがUX的に親切）
  // if (event?.organizer_profile_id !== user.id) {
  //   notFound();
  // }

  // // venue（任意：表示用）
  // const venue = await getVenueById(event.venue_id);

  // // 出演者一覧（event_id で紐付いているものだけ）
  // // acts は name 等、profiles は display_name 等（あなたの実カラムに合わせて読み替え）
  // const performances = (await getPerformances()).data.filter(p => p.event_id === eventId);

  // const list = performances ?? [];

  // const confirmed = list.filter((p) => p.status === "confirmed");
  // const pending = list.filter((p) => p.status === "pending_reconfirm");
  // const canceled = list.filter((p) => p.status === "canceled");

  // const usedSlots = confirmed.length + pending.length;
  // const maxArtists = event.max_artists ?? null;

  return (
    <div className="space-y-6">
      {/* <header className="space-y-1">
        <div className="text-sm text-neutral-600">
          {venue?.name ?? "（会場未設定）"}
        </div>
        <h1 className="text-xl font-semibold">イベント詳細</h1>
        <div className="text-sm text-neutral-700">
          日時: {formatJaDateTime(event.event_date)}
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
      /> */}
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
