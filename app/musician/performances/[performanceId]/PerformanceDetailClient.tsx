"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { PerformanceMemoEditor } from "@/components/performances/PerformanceMemoEditor";

// ★追加：編集UI
import { CoreInfoEditor } from "@/components/CoreInfoEditor";
import { PersonalPerformanceCoreEditor } from "@/components/PersonalPerformanceCoreEditor";
import { PerformanceRow } from "@/lib/performanceUtils";
import { ActRow, AttachmentRow, DetailsRow, MessageRow } from "@/lib/actQueries";


type VenueRow = { id: string; name: string };

type EventRow = {
    id: string;
    event_date: string; // timestamptz文字列想定
    venue_id: string;
    organizer_profile_id: string;
};

const BUCKET = "performance-attachments";

export default function PerformanceDetailClient({ performanceId }: { performanceId: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [savingDetails, setSavingDetails] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [posting, setPosting] = useState(false);

    const [performance, setPerformance] = useState<PerformanceRow | null>(null);
    const [act, setAct] = useState<ActRow | null>(null);

    // ★追加：event / venues / organizer判定
    const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
    const [event, setEvent] = useState<EventRow | null>(null);
    const [venues, setVenues] = useState<VenueRow[]>([]);
    const isOrganizer = useMemo(() => {
        return !!event && !!currentProfileId && event.organizer_profile_id === currentProfileId;
    }, [event, currentProfileId]);

    const [details, setDetails] = useState<DetailsRow>({
        performance_id: performanceId,
        load_in_time: null,
        set_start_time: null,
        set_end_time: null,
        set_minutes: null,
        customer_charge_yen: null,
        one_drink_required: null,
        notes: null,
    });

    const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
    const [messages, setMessages] = useState<MessageRow[]>([]);

    const [newMessage, setNewMessage] = useState("");
    const [newMessageSource, setNewMessageSource] = useState("LINE");

    const titleLine = useMemo(() => {
        if (!performance) return "";
        const venue = performance.venue_name ? ` @ ${performance.venue_name}` : "";
        return `${performance.event_date}${venue}`;
    }, [performance]);

    const actLabel = useMemo(() => {
        if (!act) return "出演名義：なし";
        return act.act_type ? `${act.name}（${act.act_type}）` : act.name;
    }, [act]);

    const reloadAll = async () => {
        setLoading(true);

        // ★現在ユーザー（profiles.id = auth.users.id なので profile_id として使う）
        const { data: auth } = await supabase.auth.getUser();
        setCurrentProfileId(auth.user?.id ?? null);

        // ★venues（個人登録編集で使う。軽いので毎回でOK）
        {
            const { data: v, error: vErr } = await supabase
                .from("venues")
                .select("id,name")
                .order("name", { ascending: true });

            if (vErr) {
                console.error("load venues error", vErr);
                setVenues([]);
            } else {
                setVenues((v ?? []) as VenueRow[]);
            }
        }

        // performance 本体
        const { data: perf, error: perfErr } = await supabase
            .from("musician_performances")
            // ★ event_id, venue_id を追加
            .select("id, profile_id, act_id, event_id, venue_id, event_date, venue_name, memo, status, status_reason, status_changed_at")
            .eq("id", performanceId)
            .single();

        if (perfErr) {
            console.error("load performance error", perfErr);
            setPerformance(null);
            setEvent(null);
            setLoading(false);
            return;
        }
        setPerformance(perf as PerformanceRow);

        // ★event（連動している場合のみ）
        if ((perf as any).event_id) {
            const { data: ev, error: evErr } = await supabase
                .from("events")
                .select("id, event_date, venue_id, organizer_profile_id")
                .eq("id", (perf as any).event_id)
                .single();

            if (evErr) {
                console.error("load event error", evErr);
                setEvent(null);
            } else {
                setEvent(ev as EventRow);
            }
        } else {
            setEvent(null);
        }

        // act
        if ((perf as any).act_id) {
            const { data: actData, error: actErr } = await supabase
                .from("acts")
                .select("id, name, act_type")
                .eq("id", (perf as any).act_id)
                .single();

            if (actErr) {
                console.error("load act error", actErr);
                setAct(null);
            } else {
                setAct(actData as ActRow);
            }
        } else {
            setAct(null);
        }

        // details（無ければ空でOK）
        const { data: det, error: detErr } = await supabase
            .from("performance_details")
            .select(
                "performance_id, load_in_time, set_start_time, set_end_time, set_minutes, customer_charge_yen, one_drink_required, notes",
            )
            .eq("performance_id", performanceId)
            .maybeSingle();

        if (detErr) {
            console.error("load details error", detErr);
        } else if (det) {
            setDetails(det as DetailsRow);
        } else {
            setDetails((prev) => ({ ...prev, performance_id: performanceId }));
        }

        // attachments
        const { data: att, error: attErr } = await supabase
            .from("performance_attachments")
            .select("id, file_url, file_path, file_type, caption, created_at")
            .eq("performance_id", performanceId)
            .order("created_at", { ascending: false });

        if (attErr) {
            console.error("load attachments error", attErr);
            setAttachments([]);
        } else {
            setAttachments((att ?? []) as AttachmentRow[]);
        }

        // messages
        const { data: msg, error: msgErr } = await supabase
            .from("performance_messages")
            .select("id, body, source, created_at")
            .eq("performance_id", performanceId)
            .order("created_at", { ascending: false });

        if (msgErr) {
            console.error("load messages error", msgErr);
            setMessages([]);
        } else {
            setMessages((msg ?? []) as MessageRow[]);
        }

        setLoading(false);
    };

    useEffect(() => {
        void reloadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [performanceId]);

    const saveDetails = async () => {
        setSavingDetails(true);

        const payload = {
            performance_id: performanceId,
            load_in_time: details.load_in_time || null,
            set_start_time: details.set_start_time || null,
            set_end_time: details.set_end_time || null,
            set_minutes: details.set_minutes ?? null,
            customer_charge_yen: details.customer_charge_yen ?? null,
            one_drink_required: details.one_drink_required,
            notes: details.notes || null,
        };

        const { error } = await supabase.from("performance_details").upsert(payload);

        setSavingDetails(false);

        if (error) {
            console.error("save details error", error);
            alert("保存に失敗しました（details）。");
            return;
        }
        await reloadAll();
    };

    const onUploadFlyer = async (file: File) => {
        if (!file) return;

        setUploading(true);

        // 画像だけ許可（必要ならpdfもOKに）
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "bin";

        // userごとのフォルダに分ける（後で掃除しやすい）
        const actId = performance?.act_id;
        if (!actId) {
            alert("このライブに出演名義（act）が設定されていません。共有アップロードできません。");
            setUploading(false);
            return;
        }
        const path = `${actId}/${performanceId}/${crypto.randomUUID()}.${safeExt}`;

        const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(path, file, { upsert: false, contentType: file.type });

        if (upErr) {
            console.error("upload error", upErr);
            setUploading(false);
            alert("アップロードに失敗しました。");
            return;
        }

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const fileUrl = pub.publicUrl;

        const { error: insErr } = await supabase.from("performance_attachments").insert({
            performance_id: performanceId,
            file_url: fileUrl,
            file_path: path,
            file_type: "flyer",
            caption: null,
        });

        setUploading(false);

        if (insErr) {
            console.error("insert attachment error", insErr);
            alert("添付情報の保存に失敗しました。");
            return;
        }

        await reloadAll();
    };

    const deleteAttachment = async (att: AttachmentRow) => {
        const ok = window.confirm("この画像を削除しますか？");
        if (!ok) return;

        // DB削除
        const { error: delErr } = await supabase
            .from("performance_attachments")
            .delete()
            .eq("id", att.id)
            .eq("performance_id", performanceId);

        if (delErr) {
            console.error("delete attachment row error", delErr);
            alert("削除に失敗しました。");
            return;
        }

        // storage削除（file_pathがある場合）
        if (att.file_path) {
            const { error: stErr } = await supabase.storage.from(BUCKET).remove([att.file_path]);
            if (stErr) {
                console.warn("storage remove failed", stErr);
            }
        }

        await reloadAll();
    };

    const postMessage = async () => {
        if (!newMessage.trim()) return;

        setPosting(true);

        const { error } = await supabase.from("performance_messages").insert({
            performance_id: performanceId,
            body: newMessage.trim(),
            source: newMessageSource || null,
        });

        setPosting(false);

        if (error) {
            console.error("insert message error", error);
            alert("保存に失敗しました（message）。");
            return;
        }

        setNewMessage("");
        await reloadAll();
    };
    const [accepting, setAccepting] = useState(false);

    const acceptOffer = async () => {
        if (!performance) return;
        if (!performance.event_id) return;

        if (!performance.act_id) {
            alert("出演名義（act）が未設定のため受諾できません。名義を設定してください。");
            return;
        }

        // offered 以外なら操作しない（好みで調整）
        if (performance.status && performance.status !== "offered" && performance.status !== "pending_reconfirm") {
            alert("この出演は受諾できる状態ではありません。");
            return;
        }

        const ok = window.confirm("このオファーを受諾しますか？");
        if (!ok) return;

        setAccepting(true);

        try {
            // 1) 対象 booking を探す（event_id + act_id）
            const { data: bk, error: bkErr } = await supabase
                .from("venue_bookings")
                .select("id, status")
                .eq("event_id", performance.event_id)
                .eq("act_id", performance.act_id)
                .maybeSingle();

            if (bkErr) throw new Error(bkErr.message);
            if (!bk) throw new Error("booking が見つかりませんでした。主催者側の招待情報が欠けています。");

            // 2) booking を accepted に
            {
                const { error } = await supabase
                    .from("venue_bookings")
                    .update({ status: "accepted" })
                    .eq("id", bk.id);
                if (error) throw new Error(error.message);
            }

            // 3) event_acts を accepted に upsert
            {
                const { error } = await supabase
                    .from("event_acts")
                    .upsert(
                        { event_id: performance.event_id, act_id: performance.act_id, status: "accepted" },
                        { onConflict: "event_id,act_id" }
                    );
      if (error) throw new Error(error.message);
    }

    // 4) performance を confirmed に
    {
      const { error } = await supabase
        .from("musician_performances")
        .update({
          status: "confirmed",
          status_reason: "ACCEPTED_BY_MUSICIAN",
          status_changed_at: new Date().toISOString(),
        })
        .eq("id", performanceId);
      if (error) throw new Error(error.message);
    }

    // 5) 枠が埋まったら events.status を matched に（open → matched）
    {
    // max_artists を取る
    const { data: ev, error: evErr } = await supabase
        .from("events")
        .select("id, status, max_artists")
        .eq("id", performance.event_id)
        .single();

    if (evErr) throw new Error(evErr.message);

    const max = ev.max_artists as number | null;
    if (max != null && max > 0) {
        // accepted数を数える（event_acts 기준）
        const { count, error: cntErr } = await supabase
        .from("event_acts")
        .select("*", { count: "exact", head: true })
        .eq("event_id", performance.event_id)
        .eq("status", "accepted");

        if (cntErr) throw new Error(cntErr.message);

        const acceptedCount = count ?? 0;

        // すでに matched/cancelled なら触らない（保守的）
        const currentStatus = ev.status as string | null;

        if (acceptedCount >= max && currentStatus === "open") {
        const { error: upErr } = await supabase
            .from("events")
            .update({ status: "matched" })
            .eq("id", performance.event_id)
            .eq("status", "open"); // 競合対策（openのときだけ）

        if (upErr) throw new Error(upErr.message);
        }
    }
    }

    alert("受諾しました。");
    await reloadAll();
  } catch (e: any) {
    console.error(e);
    alert(e?.message ?? "受諾に失敗しました。");
  } finally {
    setAccepting(false);
  }
};

    const [withdrawing, setWithdrawing] = useState(false);

    const withdrawFromEvent = async () => {
        if (!performance) return;
        if (!performance.event_id) return; // 個人登録は対象外

        // すでにキャンセル済みなら何もしない
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
            // 自分のperformanceだけ更新（安全柵として profile_id も条件に含める）
            const { data: auth } = await supabase.auth.getUser();
            const uid = auth.user?.id;
            if (!uid) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("musician_performances")
                .update({
                    status: "canceled",
                    status_reason: "WITHDRAWN_BY_MUSICIAN",
                    status_changed_at: new Date().toISOString(),
                })
                .eq("id", performanceId)
                .eq("profile_id", uid);

            if (error) throw new Error(error.message);

            // できれば通知イベントを積む（将来の通知導線用）
            // notification_events があるなら入れておくと後で効く
            // （無ければこのブロックは削除してOK）
            await supabase.from("notification_events").insert({
                type: "PERFORMANCE_WITHDRAWN",
                event_id: performance.event_id,
                payload: {
                    performance_id: performanceId,
                    profile_id: uid,
                    reason: "WITHDRAWN_BY_MUSICIAN",
                },
            });

            alert("辞退しました。");
            await reloadAll();
        } catch (e: any) {
            console.error(e);
    alert(e?.message ?? "辞退に失敗しました。");
  } finally {
    setWithdrawing(false);
  }
};


    if (loading) {
        return <main className="p-4 text-sm text-gray-500">読み込み中…</main>;
    }

    if (!performance) {
        return (
            <main className="p-4 space-y-2">
                <p className="text-sm text-red-600">ライブ情報が見つかりませんでした。</p>
                <Link href="/musician/performances" className="text-sm text-blue-600 underline">
                    タイムラインへ戻る
                </Link>
            </main>
        );
    }
    const deletePerformance = async () => {
        if (!performance) return;

        // event連動は物理削除しない（ここは方針）
        if (performance.event_id) {
            alert("この出演はイベントに紐づいているため、この画面から削除できません。辞退/キャンセルの操作を用意します。");
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
            // 1) 添付を先に取得（storage削除のため）
            const { data: attRows, error: attLoadErr } = await supabase
                .from("performance_attachments")
                .select("id, file_path")
                .eq("performance_id", performanceId);

            if (attLoadErr) throw new Error(attLoadErr.message);

            const paths = (attRows ?? [])
                .map((a: any) => a.file_path)
                .filter((p: any): p is string => typeof p === "string" && p.length > 0);

            // 2) 添付DB削除
            {
                const { error } = await supabase
                    .from("performance_attachments")
                    .delete()
                    .eq("performance_id", performanceId);
                if (error) throw new Error(error.message);
            }

            // 3) storage削除（失敗しても致命じゃない：警告にして続行）
            if (paths.length > 0) {
                const { error: stErr } = await supabase.storage.from(BUCKET).remove(paths);
                if (stErr) console.warn("storage remove failed", stErr);
            }

            // 4) messages削除
            {
                const { error } = await supabase
                    .from("performance_messages")
                    .delete()
                    .eq("performance_id", performanceId);
                if (error) throw new Error(error.message);
            }

            // 5) details削除
            {
                const { error } = await supabase
                    .from("performance_details")
                    .delete()
                    .eq("performance_id", performanceId);
                if (error) throw new Error(error.message);
            }

            // 6) 最後に performance 本体削除（所有者の安全柵として profile_id も条件に入れる）
            {
                const { data: auth } = await supabase.auth.getUser();
                const uid = auth.user?.id;
                if (!uid) throw new Error("Not authenticated");

                const { error } = await supabase
                    .from("musician_performances")
                    .delete()
                    .eq("id", performanceId)
                    .eq("profile_id", uid);

                if (error) throw new Error(error.message);
            }

            alert("削除しました。");
            router.push("/musician/performances");
            router.refresh();
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "削除に失敗しました。");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className="space-y-6">
            {/* ヘッダー */}
            <section className="rounded-xl border bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold">{titleLine}</div>
                        <div className="text-base font-bold">{actLabel}</div>
                    </div>
                    <div className="grid gap-2 ">
                        {/* event連動：辞退 */}
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


                        {/* 個人登録：削除（前に作ったやつがあるならそのまま） */}
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

                {/* ★追加：ここに「日付・会場の編集」ブロックを差し込む */}
                <div className="mt-4">
                    {performance.event_id ? (
                        // event連動：主催者だけが編集できる（CoreInfoEditor）
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
                        // 個人登録：自分でサッと直せる（PersonalPerformanceCoreEditor）
                        <PersonalPerformanceCoreEditor
                            performanceId={performance.id}
                            eventDate={performance.event_date}
                            venueId={performance.venue_id}
                            venueName={performance.venue_name}
                            venues={venues}
                            onSaved={() => void reloadAll()}   // ★これで即反映
                        />
                    )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="grid grid-cols-2 gap-2">
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
                            <span className="text-[11px] text-gray-500">出番（開始）</span>
                            <input
                                type="time"
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={details.set_start_time ?? ""}
                                onChange={(e) => setDetails((p) => ({ ...p, set_start_time: e.target.value || null }))}
                            />
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-gray-500">出番（終了）</span>
                            <input
                                type="time"
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={details.set_end_time ?? ""}
                                onChange={(e) => setDetails((p) => ({ ...p, set_end_time: e.target.value || null }))}
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
                        <label className="block">
                            <span className="text-[11px] text-gray-500">チャージ（円）</span>
                            <input
                                type="number"
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={details.customer_charge_yen ?? ""}
                                onChange={(e) =>
                                    setDetails((p) => ({
                                        ...p,
                                        customer_charge_yen: e.target.value === "" ? null : Number(e.target.value),
                                    }))
                                }
                                min={0}
                            />
                        </label>

                        <label className="block">
                            <span className="text-[11px] text-gray-500">1ドリンク</span>
                            <select
                                className="mt-1 w-full rounded border px-2 py-1 text-sm"
                                value={
                                    details.one_drink_required === null
                                        ? ""
                                        : details.one_drink_required
                                            ? "true"
                                            : "false"
                                }
                                onChange={(e) =>
                                    setDetails((p) => ({
                                        ...p,
                                        one_drink_required:
                                            e.target.value === "" ? null : e.target.value === "true",
                                    }))
                                }
                            >
                                <option value="">未設定</option>
                                <option value="true">必要</option>
                                <option value="false">不要</option>
                            </select>
                        </label>

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

            {/* フライヤー */}
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

                {attachments.length === 0 ? (
                    <p className="text-xs text-gray-600">
                        ここにフライヤー画像を入れておくと、「場所/入り/出番/チャージ」を探す回数が激減します。
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {attachments.map((a) => (
                            <div key={a.id} className="rounded border overflow-hidden">
                                <a href={a.file_url} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={a.file_url} alt="flyer" className="w-full h-40 object-cover" />
                                </a>
                                <div className="p-2 flex items-center justify-between">
                                    <span className="text-[11px] text-gray-500">追加: {new Date(a.created_at).toLocaleDateString()}</span>
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

            {/* コピペ本文 */}
            <section className="rounded-xl border bg-white px-4 py-3 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">主催者からの文章（コピペ）</h2>
                </div>

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

                {messages.length === 0 ? (
                    <p className="text-xs text-gray-600">
                        文章で届く案内（入り時間・出番・料金など）をここに集約できます。
                    </p>
                ) : (
                    <div className="space-y-2">
                        {messages.map((m) => (
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
                eventDate={performance.event_date} // YYYY-MM-DD
                initialRecordMemo={performance.memo}
                initialPrepNotes={details?.notes ?? null}
            />
        </main>
    );
}
