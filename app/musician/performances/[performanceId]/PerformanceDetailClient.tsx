"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PerformanceMemoEditor } from "@/components/performances/PerformanceMemoEditor";
import { CoreInfoEditor } from "@/components/CoreInfoEditor";
import { PersonalPerformanceCoreEditor } from "@/components/PersonalPerformanceCoreEditor";

import type { PerformanceRow } from "@/lib/utils/performance";
import type { ActRow, AttachmentRow, DetailsRow, MessageRow } from "@/lib/utils/acts";

// ★ server actions
import {
  savePerformanceDetailsFullAction,
  postPerformanceMessageAction,
  uploadPerformanceFlyerAction,
  deletePerformanceAttachmentAction,
  acceptOfferAction,
  withdrawFromEventAction,
  deletePersonalPerformanceAction,
} from "@/lib/api/performancesAction";
import { EventRow } from "@/lib/utils/events";
import { VenueRow } from "@/lib/utils/venues";
import { buildPerformancePost } from "@/lib/utils/buildPerformancePost";

export default function PerformanceDetailClient(props: {
  performanceId: string;
  currentProfileId: string | null;
  performance: PerformanceRow;
  act: ActRow | null;
  event: EventRow | null;
  venues: VenueRow[];
  details: DetailsRow | null;
  attachments: AttachmentRow[];
  messages: MessageRow[];
    open_time: string | null;
    start_time: string | null;
}) {
  const router = useRouter();

  const { performanceId, act, event, venues, currentProfileId } = props;

  const isOrganizer = useMemo(() => {
    return !!event && !!currentProfileId && event.organizer_profile_id === currentProfileId;
  }, [event, currentProfileId]);

  // Client側は編集用のstateだけ持つ（初期値はProps）
  const [details, setDetails] = useState<DetailsRow>(() => {
    return (
      props.details ?? {
        performance_id: performanceId,
        load_in_time: null,
        set_start_time: null,
        set_end_time: null,
        set_minutes: null,
        customer_charge_yen: null,
        one_drink_required: null,
        notes: null,
            open_time: null,
        srart_ttime: null
      }
    );
  });
    const [performance, setPerformance] = useState<PerformanceRow>(() => {
    return (
        props.performance ?? {
            performance_id: performanceId,
            act_id: act?.id,
            open_time: null,
            srart_ttime: null
        }
    );
  });

  const [savingDetails, setSavingDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [newMessageSource, setNewMessageSource] = useState("LINE");

  const titleLine = useMemo(() => {
    const venue = performance.venue_name ? ` @ ${performance.venue_name}` : "";
    return `${performance.event_date}${venue}`;
  }, [performance]);

  const actLabel = useMemo(() => {
    if (!act) return "出演名義：なし";
    return act.act_type ? `${act.name}（${act.act_type}）` : act.name;
  }, [act]);
  const shareText = useMemo(() => {
    return buildPerformancePost({
      performance,
      act,
      event,
      details,
      attachments: props.attachments,
      publicUrl: null, // 将来「公開ページURL」ができたら入れる
    });
  }, [performance, act, event, details, props.attachments]);

  const copyToClipboard = async (text: string) => {
    // iOS Safari でもなるべく堅牢に
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  };

  const onCopyShare = async () => {
    const ok = await copyToClipboard(shareText);
    alert(ok ? "告知文をコピーしました。" : "コピーに失敗しました。");
  };

  const saveDetails = async () => {
    setSavingDetails(true);
    try {
      await savePerformanceDetailsFullAction({
          performanceId,
          load_in_time: details.load_in_time,
          set_start_time: details.set_start_time,
          set_end_time: details.set_end_time,
          set_minutes: details.set_minutes,
          customer_charge_yen: details.customer_charge_yen,
          one_drink_required: details.one_drink_required,
          notes: details.notes,
          open_time: performance.open_time,
          start_time: performance.start_time
      });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "保存に失敗しました（details）。");
    } finally {
      setSavingDetails(false);
    }
  };

  const onUploadFlyer = async (file: File) => {
    if (!file) return;

    if (!performance.act_id) {
      alert("このライブに出演名義（act）が設定されていません。共有アップロードできません。");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("performanceId", performanceId);
      fd.set("actId", performance.act_id);
      fd.set("file", file);

      await uploadPerformanceFlyerAction(fd);
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "アップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  };

  const deleteAttachment = async (att: AttachmentRow) => {
    const ok = window.confirm("この画像を削除しますか？");
    if (!ok) return;

    try {
      await deletePerformanceAttachmentAction({
        performanceId,
        attachmentId: att.id,
      });
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "削除に失敗しました。");
    }
  };

  const postMessage = async () => {
    if (!newMessage.trim()) return;

    setPosting(true);
    try {
      await postPerformanceMessageAction({
        performanceId,
        body: newMessage.trim(),
        source: newMessageSource || null,
      });
      setNewMessage("");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "保存に失敗しました（message）。");
    } finally {
      setPosting(false);
    }
  };

  const acceptOffer = async () => {
    if (!performance.event_id) return;
    if (!performance.act_id) {
      alert("出演名義（act）が未設定のため受諾できません。名義を設定してください。");
      return;
    }
    if (performance.status && performance.status !== "offered" && performance.status !== "pending_reconfirm") {
      alert("この出演は受諾できる状態ではありません。");
      return;
    }
    const ok = window.confirm("このオファーを受諾しますか？");
    if (!ok) return;

    setAccepting(true);
    try {
      await acceptOfferAction({
        performanceId,
        eventId: performance.event_id,
        actId: performance.act_id,
      });
      alert("受諾しました。");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "受諾に失敗しました。");
    } finally {
      setAccepting(false);
    }
  };

  const withdrawFromEvent = async () => {
    if (!performance.event_id) return;
    if (performance.status === "canceled") {
      alert("すでに辞退（キャンセル）済みです。");
      return;
    }
    const ok = window.confirm(
      "この出演を辞退します。\n" +
        "・イベントからの出演枠は解放されます\n" +
        "・元に戻すには、再度応募/オファーなどの手続きが必要になる可能性があります\n\n" +
        "辞退しますか？"
    );
    if (!ok) return;

    setWithdrawing(true);
    try {
      await withdrawFromEventAction({
        performanceId,
        eventId: performance.event_id,
      });
      alert("辞退しました。");
      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? "辞退に失敗しました。");
    } finally {
      setWithdrawing(false);
    }
  };

  const deletePerformance = async () => {
    if (performance.event_id) {
      alert("この出演はイベントに紐づいているため、この画面から削除できません。辞退/キャンセルの操作を使ってください。");
      return;
    }
    const ok = window.confirm(
      "このライブ（個人登録）を削除します。\n" +
        "・確認事項、コピペ文章、添付フライヤーも一緒に消えます\n" +
        "・元に戻せません\n\n" +
        "本当に削除しますか？"
    );
    if (!ok) return;

    setDeleting(true);
    try {
        await deletePersonalPerformanceAction({ performanceId });
      } catch (e: any) {
          // redirect() は内部的に例外を投げるので、ここに来ることがある
          if (typeof e?.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
            alert("削除しました。");
            return; // 何もしない
          }
          alert(e?.message ?? "削除に失敗しました。");
      } finally {
          setDeleting(false);
      }
  };

  // --- UIは現状ほぼそのまま（props.attachments/messages をそのまま使う） ---
  return (
    <main className="space-y-6">
      <section className="rounded-xl border bg-white px-4 py-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{titleLine}</div>
            <div className="text-base font-bold">{actLabel}</div>
          </div>

          <div className="grid gap-2">
            <button
  type="button"
  onClick={() => void onCopyShare()}
  className="shrink-0 inline-flex items-center justify-center rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
>
  告知文をコピー
</button>
            {performance.event_id && performance.status !== "canceled" && (
              <>
                {(performance.status === "offered" || performance.status === "pending_reconfirm") && (
                  <button
                    type="button"
                    onClick={() => void acceptOffer()}
                    disabled={accepting}
                    className="shrink-0 inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {accepting ? "受諾中…" : "受諾"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void withdrawFromEvent()}
                  disabled={withdrawing}
                  className="shrink-0 inline-flex items-center rounded border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 disabled:opacity-50"
                >
                  {withdrawing ? "辞退中…" : "辞退"}
                </button>
              </>
            )}

            {!performance.event_id && (
              <button
                type="button"
                onClick={() => void deletePerformance()}
                disabled={deleting}
                className="shrink-0 inline-flex items-center rounded border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
              >
                {deleting ? "削除中…" : "削除"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          {performance.event_id ? (
            isOrganizer && event ? (
              <CoreInfoEditor
                eventId={event.id}
                currentDateISO={event.event_date}
                currentVenueId={event.venue_id}
                venues={venues}
              />
            ) : (
              <div className="rounded-xl border p-4 text-sm text-neutral-700">
                この出演はイベントに紐づいています。日付・会場の変更は主催者のみ可能です。
              </div>
            )
          ) : (
            <PersonalPerformanceCoreEditor
              performanceId={performance.id}
              eventDate={performance.event_date}
              venueId={performance.venue_id}
              venueName={performance.venue_name}
              venues={venues}
              onSaved={() => router.refresh()}
            />
          )}
        </div>

        {/* details UI…（今のUIそのまま） */}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="grid grid-cols-2 gap-2">
                        <label className="block">
                            <span className="text-[11px] text-gray-500">開場</span>
                            <input
                                type="time"
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={performance.open_time ?? ""}
                                onChange={(e) => setPerformance((p) => ({ ...p, open_time: e.target.value || null }))}
                            />
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-gray-500">開演</span>
                            <input
                                type="time"
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={performance.start_time ?? ""}
                                onChange={(e) => setPerformance((p) => ({ ...p, start_time: e.target.value || null }))}
                            />
                        </label>
                        <label className="block">
                            <span className="text-[11px] text-gray-500">入り（任意）</span>
                            <input
                                type="time"
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={details.load_in_time ?? ""}
                                onChange={(e) => setDetails((p) => ({ ...p, load_in_time: e.target.value || null }))}
                            />
                        </label>


                        <label className="block">
                            <span className="text-[11px] text-gray-500">持ち時間（分）</span>
                            <input
                                type="number"
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={details.set_minutes ?? ""}
                                onChange={(e) =>
                                    setDetails((p) => ({ ...p, set_minutes: e.target.value === "" ? null : Number(e.target.value) }))
                                }
                                min={0}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={saveDetails}
                            disabled={savingDetails}
                            className="col-span-2 inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                        >
                            {savingDetails ? "保存中…" : "確認事項を保存"}
                        </button>
                    </div>
                </div>
            </section>

<section className="hidden rounded-xl border bg-white px-4 py-3 shadow-sm">
  {/* ヘッダー：情報 / 開場開演 / 操作 */}
{/* ヘッダー：情報 / 開場開演 / 操作（内側は透明） */}
<div className="grid gap-3 md:grid-cols-[1fr,auto,auto] md:items-start">
  {/* 左：日付・会場・名義 */}
  <div className="min-w-0">
    <div className="text-sm font-semibold">{titleLine}</div>
    <div className="mt-0.5 text-base font-bold truncate">{actLabel}</div>
  </div>

  {/* 中央：開場・開演（透明、コンパクト） */}
  <div className="md:pt-0.5">
    <div className="grid grid-cols-2 gap-2">
      <label className="block">
        <span className="text-[11px] text-gray-500">開場</span>
        <input
          type="time"
          className="mt-1 w-full rounded border bg-white px-2 py-1 text-sm disabled:bg-gray-50"
          value={performance.open_time ?? ""}
          disabled={!!performance.event_id} // ←仕様通り：イベント紐づきは編集不可
          onChange={(e) => {
            // あなたの改修済みロジックに合わせて
          }}
        />
      </label>

      <label className="block">
        <span className="text-[11px] text-gray-500">開演</span>
        <input
          type="time"
          className="mt-1 w-full rounded border bg-white px-2 py-1 text-sm disabled:bg-gray-50"
          value={performance.start_time ?? ""}
          disabled={!!performance.event_id}
          onChange={(e) => {
            // あなたの改修済みロジックに合わせて
          }}
        />
      </label>
    </div>

    {performance.event_id && (
      <div className="mt-1 text-[11px] text-gray-500">
        ※イベントに紐づく出演のため、時刻は編集できません
      </div>
    )}
  </div>

  {/* 右：操作ボタン（モバイル横 / md縦） */}
  <div className="flex gap-2 md:flex-col md:items-stretch md:gap-2">
    {performance.event_id && performance.status !== "canceled" && (
      <>
        {(performance.status === "offered" || performance.status === "pending_reconfirm") && (
          <button
            type="button"
            onClick={() => void acceptOffer()}
            disabled={accepting}
            className="inline-flex flex-1 items-center justify-center rounded bg-emerald-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 md:flex-none"
          >
            {accepting ? "受諾中…" : "受諾"}
          </button>
        )}

        <button
          type="button"
          onClick={() => void withdrawFromEvent()}
          disabled={withdrawing}
          className="inline-flex flex-1 items-center justify-center rounded border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 disabled:opacity-50 md:flex-none"
        >
          {withdrawing ? "辞退中…" : "辞退"}
        </button>
      </>
    )}

    {!performance.event_id && (
      <button
        type="button"
        onClick={() => void deletePerformance()}
        disabled={deleting}
        className="inline-flex items-center justify-center rounded border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-50"
      >
        {deleting ? "削除中…" : "削除"}
      </button>
    )}
  </div>
</div>


  {/* 以降もそのまま */}
</section>

            {/* flyer */}
            <section className="rounded-xl border bg-white px-4 py-3 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">フライヤー</h2>
                    <label className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white cursor-pointer">
                        {uploading ? "アップロード中…" : "画像を追加"}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void onUploadFlyer(file);
                                e.currentTarget.value = "";
                            }}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {props.attachments.length === 0 ? (
                    <p className="text-xs text-gray-600">ここにフライヤー画像を入れておくと探す回数が激減します。</p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {props.attachments.map((a) => (
                            <div key={a.id} className="rounded border overflow-hidden">
                                <a href={a.file_url} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={a.file_url} alt="flyer" className="w-full h-40 object-cover" />
                                </a>
                                <div className="p-2 flex items-center justify-between">
                                    <span className="text-[11px] text-gray-500">
                                        追加: {new Date(a.created_at).toLocaleDateString()}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => void deleteAttachment(a)}
                                        className="text-[11px] text-red-600 hover:underline"
                                    >
                                        削除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* messages */}
            <section className="rounded-xl border bg-white px-4 py-3 shadow-sm space-y-3">
                <h2 className="text-sm font-semibold">主催者からの文章（コピペ）</h2>

                <div className="grid gap-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="w-28 rounded border px-2 py-1 text-sm"
                            value={newMessageSource}
                            onChange={(e) => setNewMessageSource(e.target.value)}
                            placeholder="LINE"
                        />
                        <button
                            type="button"
                            onClick={postMessage}
                            disabled={posting || !newMessage.trim()}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                        >
                            {posting ? "保存中…" : "保存"}
                        </button>
                    </div>

                    <textarea
                        className="w-full rounded border px-2 py-1 text-sm h-28"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="LINEで届いた案内文を、そのまま貼り付けてください。"
                    />
                </div>

                {props.messages.length === 0 ? (
                    <p className="text-xs text-gray-600">文章で届く案内をここに集約できます。</p>
                ) : (
                    <div className="space-y-2">
                        {props.messages.map((m) => (
                            <div key={m.id} className="rounded border bg-white px-3 py-2">
                                <div className="text-[11px] text-gray-500 mb-1">
                                    {m.source ? `${m.source} / ` : ""}
                                    {new Date(m.created_at).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-800 whitespace-pre-wrap">{m.body}</div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <PerformanceMemoEditor
                performanceId={performance.id}
                eventDate={performance.event_date}
                initialRecordMemo={performance.memo}
                initialPrepNotes={details?.notes ?? null}
            />

            <div className="pt-4">
                <Link href="/musician/performances" className="text-sm text-blue-600 underline">
                    タイムラインへ戻る
                </Link>
            </div>
        </main>
    );
}
