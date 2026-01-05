// app/musician/organized-events/[eventId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";;
import { PerformanceCard } from "../performances/PerformanceCard";
import { ActRow, getActsByIds, getAllActs, insertAct } from "@/lib/api/acts";
import { parseYmdLocal, addDays, fmtMMdd, toYmdLocal } from "@/lib/utils/date";
import {
  PREP_DEFS,
  normalizeAct,
  detailsSummary,
  statusText,
} from "@/lib/utils/performance";
import { useCurrentUser } from "@/lib/auth/session.client";
import { getMyEvents, updateEventStatus, upsertAllEventActs, upsertEventAct } from "@/lib/api/events";
import { getEventActs, getEventBookings } from "@/lib/db/venues";
import { createBooking, getBookingsWithDetails } from "@/lib/db/bookings";
type EventStatus = "open" | "pending" | "draft" | "matched" | "cancelled";

type EventRow = {
  id: string;
  venue_id: string;
  title: string;
  event_date: string;
  open_time: string | null;
  start_time: string;
  end_time: string;
  max_artists: number | null;
  status: EventStatus;
  charge: number | null;
  conditions: string | null;
  created_at: string;
  venues?: { id: string; name: string }[];
};
type BookingStatus = "offered" | "pending" | "accepted" | "rejected";

type BookingRow = {
  id: string;
  status: BookingStatus;
  message: string | null;
  created_at: string;
  event_id: string;
  act_id: string;
  act_name: string;
  act_type: string;
  owner_profile_id: string | null;
};
type Props = {
  eventId: string;
};
export default function MusicianOrganizedEventDetailClient({ eventId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userMissing, setUserMissing] = useState(false);

  const [event, setEvent] = useState<EventRow | null>(null);

  // 決定済み出演者（event_acts.status = accepted）
  const [acts, setActs] = useState<ActRow[]>([]);

  // 応募・招待一覧（venue_bookings）
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  // 招待用に使える act 一覧
  const [allActs, setAllActs] = useState<ActRow[]>([]);
  const [actsLoading, setActsLoading] = useState(true);
  const [inviteActId, setInviteActId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // ゲスト（アプリ未使用者）追加用
  const [guestName, setGuestName] = useState("");
  const [guestActType, setGuestActType] = useState("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [addingGuest, setAddingGuest] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // acceptedCount は決定済み（event_acts）から計算
  const acceptedCount = useMemo(() => acts.length, [acts]);

  const maxArtists = event?.max_artists ?? null;
  const isFull = maxArtists != null && acceptedCount >= maxArtists;

  const formatTime = (t: string | null | undefined) =>
    t ? t.slice(0, 5) : null;

  const load = async () => {
    if (!eventId) {
      setError("eventId が指定されていません。");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setBookingError(null);
    setActsLoading(true);

    try {
      const user = await useCurrentUser();
      if (!user) {
        setUserMissing(true);
        return;
      }

      // 1. 自分が企画したイベントかつ指定IDのものを取得
      const data = await getMyEvents();
      const eventRow = data.find((e) => e.id === eventId);
      if (!eventRow) {
        setError("このイベントは見つからないか、あなたの企画ではありません。");
        return;
      }

      const e = eventRow as EventRow;
      setEvent(e);

      // 2. event_acts から accepted の出演名義を取得
      const eventActs = await getEventActs(eventId);
      const acceptedActs = eventActs.filter((ea) => ea.status === "accepted");

      const actList: ActRow[] =
        (eventActs ?? []).map((row: any) => ({
          id: row.acts?.id ?? row.act_id,
          name: row.acts?.name ?? "(不明な名義)",
          act_type: row.acts?.act_type ?? "",
          owner_profile_id: row.acts?.owner_profile_id,
          is_temporary: row.acts?.is_temporary,
          description: row.acts?.description,
          icon_url: row.acts?.icon_url,
          photo_url: row.acts?.photo_url,
          profile_link_url: row.acts?.profile_link_url,
          
        })) ?? [];

      setActs(actList);

      // 3. venue_bookings から応募・招待一覧を取得
      const bookings = await getEventBookings(eventId);

      const actIds = Array.from(
        new Set(bookings.map((b: any) => b.act_id)),
      ) as string[];

      let actMapForBookings = new Map<string, ActRow>();

      if (actIds.length > 0) {
        const actsForBookings = await getActsByIds(actIds);

        actMapForBookings = new Map(
          (actsForBookings ?? []).map((a: any) => [
            a.id as string,
            {
              id: a.id,
              name: a.name,
              act_type: a.act_type,
              owner_profile_id: a.owner_profile_id,
            } as ActRow,
          ]),
        );
      }

      const bookingList: BookingRow[] = bookings.filter(p => p.status !== "accepted").map((b: any) => {
        const act = actMapForBookings.get(b.act_id as string);
        return {
          id: b.id,
          status: b.status as BookingStatus,
          message: b.message,
          created_at: b.created_at,
          event_id: b.event_id,
          act_id: b.act_id,
          act_name: act?.name ?? "(不明な名義)",
          act_type: act?.act_type ?? "",
          owner_profile_id: act?.owner_profile_id ?? null,
        };
      });

      setBookings(bookingList);

      // 4. 招待候補の全 act を取得（シンプルに全件）
      const { data: allActsRows, error: allActsError } = await supabase
        .from("acts")
        .select("id, name, act_type")
        .order("name", { ascending: true });
        
      if (allActsError) throw allActsError;
      const allActs = getAllActs();

      setAllActs((allActsRows ?? []) as ActRow[]);
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "イベント情報の取得に失敗しました。");
    } finally {
      setLoading(false);
      setActsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setInviteError(null);

    if (!inviteActId) {
      setInviteError("招待するミュージシャン（名義）を選択してください。");
      return;
    }

    setInviting(true);
    try {
      // すでにこのイベントに紐づく booking がないか簡易チェック
      const existing = (await getEventBookings(event.id)).find(b => b.act_id === inviteActId);

      if (existing ) {
        setInviteError("このミュージシャンはすでにこのイベントに紐づいています。");
        return;
      }

      // 招待も応募もひとまず pending として venue に流す
      const bookings = await createBooking({
        eventId: event.id,
        musicianId: inviteActId,
        venueId: event.venue_id,
        message: inviteMessage.trim(),
      });

      const { data, error } = await supabase.rpc("create_offer_and_inbox_performance", {
        p_event_id: event.id,
        p_act_id: inviteActId,
      });

      console.log("offer rpc result", { data, error });
      if (error) throw error;

      setInviteActId("");
      setInviteMessage("");
      await load(); // 応募一覧を更新
    } catch (e: any) {
      console.error(e);
      setInviteError(e.message ?? "招待の作成に失敗しました。");
    } finally {
      setInviting(false);
    }
  };

  const handleApprove = async (booking: BookingRow) => {
    if (!event) return;
    setBookingError(null);

    // 枠制限チェック
    if (maxArtists != null && acceptedCount >= maxArtists) {
      setBookingError(
        `最大組数(${maxArtists}組)に達しているため、これ以上承認できません。`,
      );
      return;
    }

    setMutatingId(booking.id);
    try {
      // 1. venue_bookings を accepted に
      const { error: bookingError } = await supabase
        .from("venue_bookings")
        .update({ status: "accepted" })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // 2. event_acts に accepted を upsert
      const { error: eaError } = await supabase
        .from("event_acts")
        .upsert(
          {
            event_id: booking.event_id,
            act_id: booking.act_id,
            status: "accepted",
          },
          { onConflict: "event_id,act_id" },
        );

      if (eaError) throw eaError;

      // 3. 上限に達したら events.status を matched に更新
      if (maxArtists != null) {
        const newAcceptedCount =
          acceptedCount + (booking.status === "accepted" ? 0 : 1);

        if (newAcceptedCount >= maxArtists) {
          const { error: statusError } = await supabase
            .from("events")
            .update({ status: "matched" })
            .eq("id", booking.event_id);

          if (statusError) throw statusError;
        }
      }

      await load();
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setBookingError(e.message ?? "承認に失敗しました。");
    } finally {
      setMutatingId(null);
    }
  };

  const handleReject = async (booking: BookingRow) => {
    if (!event) return;
    setBookingError(null);
    setMutatingId(booking.id);
    try {
      // 1. venue_bookings を rejected に
      const { error: bookingError } = await supabase
        .from("venue_bookings")
        .update({ status: "rejected" })
        .eq("id", booking.id);

      if (bookingError) throw bookingError;

      // 2. event_acts に存在していれば削除
      const { error: eaError } = await supabase
        .from("event_acts")
        .delete()
        .eq("event_id", booking.event_id)
        .eq("act_id", booking.act_id);

      if (eaError) throw eaError;

      await load();
      router.refresh();
    } catch (e: any) {
      console.error(e);
      setBookingError(e.message ?? "拒否に失敗しました。");
    } finally {
      setMutatingId(null);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!event) return;

  setGuestError(null);

  // ★ まず現在のユーザーを取得しておく
  const user = await useCurrentUser();
  if (!user) {
    setGuestError("ログインが必要です。");
    return;
  }

  if (!guestName.trim()) {
    setGuestError("名義名を入力してください。");
    return;
  }
  if (!guestActType) {
    setGuestError("形態（ソロ／バンドなど）を選択してください。");
    return;
  }

  // 枠制限チェック（ゲストは「決定済み」で追加する前提）
  if (maxArtists != null && acceptedCount >= maxArtists) {
    setGuestError(
      `最大組数(${maxArtists}組)に達しているため、これ以上追加できません。`,
    );
    return;
  }

  setAddingGuest(true);
  try {
    // ★ owner_profile_id を必ず渡す
    const newAct = await insertAct({
      guestName: guestName.trim(),
      guestActType: guestActType,
      ownerProfileId: user?.user?.id || "",
    });

    const actId = (newAct as { id: string }).id;

    // 2. event_acts に accepted として紐づけ
    await upsertEventAct({ 
      eventId: event.id,
      actId: actId,
      status: "accepted",
    });

    // 3. venue_bookings にも accepted として登録
    const { error: bookingError } = await supabase
      .from("venue_bookings")
      .insert({
        event_id: event.id,
        act_id: actId,
        status: "accepted",
        message: "主催によるゲスト枠として追加",
      });
    await createBooking({
      eventId: event.id,
      musicianId: actId,
      venueId: event.venue_id,
      message: ""
    });

    if (bookingError) throw bookingError;

    // 4. 上限に達したら events.status を matched に更新
    if (maxArtists != null) {
      const newAcceptedCount = acceptedCount + 1;
      if (newAcceptedCount >= maxArtists) {
        updateEventStatus({ eventId: event.id, status: "matched" });

      }
    }

    setGuestName("");
    setGuestActType("");
    await load();
    router.refresh();
  } catch (e: any) {
    console.error(e);
    setGuestError(e.message ?? "ゲスト名義の追加に失敗しました。");
  } finally {
    setAddingGuest(false);
  }
};


  // ===== UI =====

  if (loading) {
    return (
      <main >
        <p className="text-sm text-gray-500">読み込み中...</p>
      </main>
    );
  }

  if (userMissing) {
    return (
      <main >
        <p className="text-sm text-red-500">ログインが必要です。</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="space-y-3">
        <p className="text-sm text-red-500">
          {error ?? "イベントが見つかりませんでした。"}
        </p>
        <Link
          href="/musician/organized-events"
          className="inline-flex text-xs text-blue-600 underline"
        >
          自分が企画したイベント一覧に戻る
        </Link>
      </main>
    );
  }

  const openTime = formatTime(event.open_time);
  const startTime = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);
  const todayStr = toYmdLocal();
  const todayDate = parseYmdLocal(todayStr);
  return (
    <main className="space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-1">{event.title}</h1>
          <p className="text-sm text-gray-600">
            {event.event_date}{" "}
            {openTime && (
              <>
                Open {openTime}
                {" / "}
              </>
            )}
            {startTime && <>Start {startTime}</>}
            {endTime && <> 〜 {endTime}</>}
          </p>

          {event.venues && event.venues.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              会場: <span className="font-semibold">{event.venues[0].name}</span>
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            ステータス: <span className="font-mono">{event.status}</span>{" "}
            {maxArtists != null && (
              <>
                / 決定済み{" "}
                <span className="font-mono">
                  {acceptedCount} / {maxArtists}
                </span>
              </>
            )}
          </p>
          <Link
            href={`/organizer/events/${eventId}/edit`}
            className="text-xs rounded border px-3 py-1.5 hover:bg-gray-50"
          >
            編集
          </Link>

        </div>

        <div className="flex flex-col items-end gap-2">
          <Link
            href="/musician/organized-events"
            className="text-xs text-blue-600 underline"
          >
            一覧に戻る
          </Link>

          {/* 将来:
              - この企画をコピーする
              - 公開ページを見る
            をここに足す */}
        </div>
      </div>

      {/* 基本情報カード */}
      <section className="border rounded bg-white shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-1">基本情報</h2>

        <div className="text-xs text-gray-700 space-y-1">
          <div>
            <span className="font-semibold">日程: </span>
            <span>{event.event_date}</span>
          </div>

          <div>
            <span className="font-semibold">時間: </span>
            <span>
              {openTime && <>Open {openTime} / </>}
              {startTime && <>Start {startTime}</>}
              {endTime && <> 〜 {endTime}</>}
            </span>
          </div>

          {event.charge != null && (
            <div>
              <span className="font-semibold">料金: </span>
              <span>¥{event.charge.toLocaleString()}</span>
            </div>
          )}

          {event.conditions && (
            <div>
              <span className="font-semibold">条件: </span>
              <span>{event.conditions}</span>
            </div>
          )}
        </div>
      </section>

      {/* 出演名義（決定済み） */}
      <section className="border rounded bg-white shadow-sm p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-1">出演名義（決定済み）</h2>

        {acts.length === 0 && (
          <p className="text-sm text-gray-500">
            まだ確定している出演者はいません。
          </p>
        )}

        <ul className="space-y-1">
          {acts.map((act) => (
            <li
              key={act.id}
              className="flex items-center justify-between border rounded px-2 py-1"
            >
              <div>
                <div className="font-medium text-sm">{act.name}</div>
                <div className="text-[11px] text-gray-500">{act.act_type}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 応募者一覧 + 承認／拒否 */}
      <section className="border rounded bg-white shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold mb-1">応募・招待一覧</h2>
          {maxArtists != null && (
            <div className="text-[11px] text-gray-600">
              決定済み:{" "}
              <span className="font-mono">
                {acceptedCount} / {maxArtists}
              </span>
            </div>
          )}
        </div>

        {bookingError && (
          <p className="text-sm text-red-500">{bookingError}</p>
        )}

        { maxArtists != null && isFull && (
          <p className="text-sm">
            最大組数に達しました。
          </p>
        )}
        { !isFull && bookings.length === 0 && !bookingError && (
          <p className="text-sm text-gray-500">
            まだ応募や招待はありません。
          </p>
        )}

        <ul className="space-y-2">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="bg-white space-y-1"
            >
              <PerformanceCard
                p={{
                  id: "",
                  event_id: b.event_id,
                  venue_id: event.venue_id,
                  event_date: event.event_date,
                  venue_name: event.venues && event.venues.length > 0 ? event.venues[0].name : "",
                  act_id: b.act_id,
                  status: b.status === "pending" ? "offered" : b.status === "accepted" ? "confirmed" : "canceled",
                  details: null,
                  flyer_url: null,
                  profile_id: "",
                  act_name: b.act_name,
                  memo: b.message,
                  status_changed_at: null,
                  status_reason: null,
                  event_title: event.title,
                  acts: {
                    id: b.act_id,
                    name: b.act_name,
                    act_type: b.act_type,
                    owner_profile_id: "",
                    is_temporary: false,
                    description: null,
                    icon_url: null,
                    photo_url: null,
                    profile_link_url: null
                  },
                }}
                prepDefs={PREP_DEFS}
                todayDate={todayDate}
                normalizeAct={normalizeAct}
                detailsSummary={detailsSummary}
                parseYmdLocal={parseYmdLocal}
                addDays={addDays}
                fmtMMdd={fmtMMdd}
                statusText={statusText}
                onToggleDone={() => {}}
              />

              {b.status === "offered" && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => void handleApprove(b)}
                    disabled={mutatingId === b.id || isFull}
                    className="px-3 py-1.5 rounded bg-green-600 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {mutatingId === b.id ? "承認中..." : "承認する"}    
                  </button>
                  <button
                    onClick={() => void handleReject(b)}
                    disabled={mutatingId === b.id}
                    className="px-3 py-1.5 rounded bg-red-600 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {mutatingId === b.id ? "拒否中..." : "拒否する"}
                  </button>
                </div>
              )}
            </li> 
          ))}
        </ul>
      </section>

      {/* ミュージシャンをお誘いする（既存） */}
      {!isFull && (
      <section className="border rounded bg-white shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-semibold mb-1">ミュージシャンをお誘いする</h2>
        <p className="text-xs text-gray-600">
          このイベントに出演してほしいミュージシャン（名義）を選んで、会場側に
          「この組み合わせでやりたい」という意思を伝えます。
          招待も応募と同じく、venue のブッキング一覧に pending として登録されます。
        </p>

        {actsLoading && (
          <p className="text-sm text-gray-500">ミュージシャン一覧を読み込み中...</p>
        )}

        {!actsLoading && allActs.length === 0 && (
          <p className="text-sm text-gray-500">
            まだ登録されているミュージシャン（名義）がありません。
          </p>
        )}

        {inviteError && (
          <p className="text-sm text-red-500">{inviteError}</p>
        )}

        {!actsLoading && allActs.length > 0 && (
          <form
            onSubmit={handleInvite}
            className="space-y-3 text-sm"
          >
            <label className="block">
              招待するミュージシャン（名義）
              <select
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                value={inviteActId}
                onChange={(e) => setInviteActId(e.target.value)}
              >
                <option value="">選択してください</option>
                {allActs.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}（{a.act_type}）
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              招待メッセージ（任意）
              <textarea
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                rows={2}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="例: この日は◯◯と対バンでどうですか？ など"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={inviting || !allActs.length}
                className="px-4 py-1.5 rounded bg-emerald-600 text-xs font-semibold text-white disabled:opacity-50"
              >
                {inviting ? "招待中..." : "このミュージシャンを招待する"}
              </button>
            </div>
          </form>
        )}
      </section>
      )}
      {/* アプリ未使用のゲストを追加する */}
      {!isFull && (
        <section className="border rounded bg-white shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold mb-1">アプリ未使用のゲストを追加する</h2>
          <p className="text-xs text-gray-600">
            まだこのアプリを使っていないバンドや弾き語りを、ゲストとしてこのイベントに追加します。
            後から本人がアカウントを作成したときに、この名義を引き継げる余地を残した形で登録されます。
          </p>

          {guestError && (
            <p className="text-sm text-red-500">{guestError}</p>
          )}

          <form
            onSubmit={handleAddGuest}
            className="space-y-3 text-sm"
          >
            <label className="block">
              名義名
              <input
                type="text"
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="例: 〇〇バンド / △△（弾き語り）"
              />
            </label>

            <label className="block">
              形態
              <select
                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                value={guestActType}
                onChange={(e) => setGuestActType(e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="solo">ソロ</option>
                <option value="band">バンド</option>
                <option value="duo">デュオ</option>
                <option value="unit">ユニット</option>
                <option value="other">その他</option>
              </select>
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={addingGuest}
                className="px-4 py-1.5 rounded bg-indigo-600 text-xs font-semibold text-white disabled:opacity-50"
              >
                {addingGuest ? "追加中..." : "ゲストとして追加する"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}
