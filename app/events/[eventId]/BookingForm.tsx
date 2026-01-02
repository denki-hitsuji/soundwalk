// app/events/[eventId]/BookingForm.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, getCurrentUser } from "@/lib/supabase/client.legacy";;

type Props = {
  eventId: string;
};

type MyAct = {
  id: string;
  name: string;
  act_type: string;
  owner_profile_id: string;
  description: string | null;
  icon_url: string | null;
};

export function BookingForm({ eventId }: Props) {
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loadingAct, setLoadingAct] = useState(true);
  const [act, setAct] = useState<MyAct | null>(null);

  // 自分の現在の名義を表示用に取得
  useEffect(() => {
    const loadAct = async () => {
      setLoadingAct(true);
      setError(null);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setError("ログインが必要です。");
          return;
        }

        const { data: acts, error: actsError } = await supabase
          .from("acts")
          .select("*")
          .eq("owner_profile_id", user.id)
          .order("created_at", { ascending: true });

        if (actsError) throw actsError;

        if (acts && acts.length > 0) {
          setAct(acts[0] as MyAct);
        } else {
          // なければデフォルトActを作成
          const { data: newAct, error: insertActError } = await supabase
            .from("acts")
            .insert({
              name: user.user_metadata?.name ?? "My Act",
              act_type: "solo",
              owner_profile_id: user.id,
            })
            .select("*")
            .single();

          if (insertActError) throw insertActError;
          setAct(newAct as MyAct);
        }
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "名義情報の取得に失敗しました。");
      } finally {
        setLoadingAct(false);
      }
    };

    void loadAct();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!act) {
      setError("活動名義が取得できていません。");
      return;
    }

    setSubmitting(true);
    try {
      const trimmedMessage = message.trim();

      const { error: bookingError } = await supabase.from("venue_bookings").insert({
        event_id: eventId,
        act_id: act.id,
        message: trimmedMessage || null, // ← これはあくまで「ひと言メッセージ」
        status: "pending",
      });

      if (bookingError) throw bookingError;

      setInfo("この名義で応募を送信しました。");
      setMessage("");
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? "応募の送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border rounded p-4 space-y-4 max-w-md bg-white shadow-sm">
      <h2 className="font-semibold">このイベントにブッキングする</h2>

      {/* 現在の名義表示 */}
      <div className="text-xs border rounded px-3 py-2 bg-slate-50">
        <div className="font-semibold mb-1">使用する活動名義</div>
        {loadingAct && <p className="text-gray-500">名義を読み込み中...</p>}
        {!loadingAct && act && (
          <>
            <p>
              名義：<span className="font-medium">{act.name}</span>
              {act.act_type && (
                <span className="ml-2 text-[11px] text-gray-500">
                  ({act.act_type})
                </span>
              )}
            </p>
            {act.description && (
              <p className="mt-1 text-[11px] text-gray-600">
                紹介文：{act.description}
              </p>
            )}
          </>
        )}
        {!loadingAct && !act && (
          <p className="text-red-500">活動名義を取得できませんでした。</p>
        )}

        <p className="mt-2 text-[11px] text-gray-500">
          名義名や紹介文を変更したい場合は{" "}
          <Link href="/musician/profile" className="underline">
            プロフィール編集
          </Link>{" "}
          から編集してください。
        </p>
      </div>

      {info && <p className="text-sm text-green-600">{info}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* ひと言メッセージフォーム */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-sm">
          お店へのひと言メッセージ（任意）
          <span className="block text-[11px] text-gray-500">
            例：「ブルース寄りの選曲でお届けします」「音量は控えめにできます」など。
            名義やジャンルなどの基本情報はプロフィール側で設定されます。
          </span>
          <textarea
            name="message"
            className="mt-1 w-full border rounded p-2 text-sm"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || loadingAct || !act}
          className="px-4 py-2 border rounded text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "送信中..." : "この名義で応募する"}
        </button>
      </form>
    </section>
  );
}
