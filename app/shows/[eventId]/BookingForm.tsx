// app/events/[eventId]/BookingForm.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ensureMyDefaultAct } from "@/lib/api/actsAction";
import { createBooking } from "@/lib/api/bookingsAction";
import { EventRow } from "@/lib/utils/events";
import { ActRow } from "@/lib/utils/acts";
;

type Props = {
  userId: string;
  event: EventRow;
  act: ActRow
};

export function BookingForm({ userId, event, act }: Props) {
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

      await createBooking({
        userId: userId,
        eventId: event.id,
        venueId: event.venue_id,
        actId: act.id,
        message: trimmedMessage , // ← これはあくまで「ひと言メッセージ」
        status: "pending", 
      })

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
        { act && (
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
        { !act && (
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
          disabled={submitting || !act}
          className="px-4 py-2 border rounded text-sm font-semibold disabled:opacity-50"
        >
          {submitting ? "送信中..." : "この名義で応募する"}
        </button>
      </form>
    </section>
  );
}
