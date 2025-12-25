"use client";

import { useState, useTransition } from "react";
import { updateEventCore } from "@/app/actions/updateEventCore";

type Venue = { id: string; name: string };

type Props = {
  eventId: string;
  currentDateISO: string;     // 現在のdate（ISO）
  currentVenueId: string;
  venues: Venue[];            // 例：候補会場一覧
};

export function CoreInfoEditor(props: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftDateISO, setDraftDateISO] = useState(props.currentDateISO);
  const [draftVenueId, setDraftVenueId] = useState(props.currentVenueId);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isPending, startTransition] = useTransition();
  const hasChanges =
    draftDateISO !== props.currentDateISO || draftVenueId !== props.currentVenueId;

  function resetDraft() {
    setDraftDateISO(props.currentDateISO);
    setDraftVenueId(props.currentVenueId);
  }

  function onCancel() {
    resetDraft();
    setIsEditing(false);
    setShowConfirm(false);
  }

  function onSave() {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    setShowConfirm(true);
  }

  function onConfirmSave() {
    startTransition(async () => {
      await updateEventCore({
        eventId: props.eventId,
        newDateISO: draftDateISO,
        newVenueId: draftVenueId,
      });
      // 成功したら編集モード解除
      setShowConfirm(false);
      setIsEditing(false);
      // 画面の値更新は、親側で revalidatePath / router.refresh などで反映させるのが綺麗
      // ここでは最低限：リロードを促さずに済むなら router.refresh() を使う
      window.location.reload();
    });
  }

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">基本情報（日付・会場）</h3>

        {!isEditing ? (
          <button
            className="text-sm underline"
            onClick={() => setIsEditing(true)}
          >
            編集
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              className="text-sm underline"
              disabled={isPending}
              onClick={onCancel}
            >
              キャンセル
            </button>
            <button
              className="text-sm underline"
              disabled={isPending || !hasChanges}
              onClick={onSave}
              title={!hasChanges ? "変更がありません" : ""}
            >
              保存
            </button>
          </div>
        )}
      </div>

      {/* 日付 */}
      <div className="grid grid-cols-[120px_1fr] items-center gap-3">
        <div className="text-sm text-neutral-600">日付</div>
        {!isEditing ? (
          <div>{formatJaDateTime(props.currentDateISO)}</div>
        ) : (
          <input
            type="datetime-local"
            className="w-full rounded-md border px-3 py-2"
            value={toDatetimeLocalValue(draftDateISO)}
            onChange={(e) => setDraftDateISO(fromDatetimeLocalValue(e.target.value))}
            disabled={isPending}
          />
        )}
      </div>

      {/* 会場 */}
      <div className="grid grid-cols-[120px_1fr] items-center gap-3">
        <div className="text-sm text-neutral-600">会場</div>
        {!isEditing ? (
          <div>{props.venues.find(v => v.id === props.currentVenueId)?.name ?? "—"}</div>
        ) : (
          <select
            className="w-full rounded-md border px-3 py-2"
            value={draftVenueId}
            onChange={(e) => setDraftVenueId(e.target.value)}
            disabled={isPending}
          >
            {props.venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 保存確認モーダル（簡易版） */}
      {showConfirm && (
        <div className="rounded-xl border p-4 bg-white space-y-3">
          <div className="font-semibold">変更を確定しますか？</div>

          <div className="text-sm space-y-1">
            <div>
              <span className="text-neutral-600">日付：</span>
              {formatJaDateTime(props.currentDateISO)} → {formatJaDateTime(draftDateISO)}
            </div>
            <div>
              <span className="text-neutral-600">会場：</span>
              {venueName(props.venues, props.currentVenueId)} → {venueName(props.venues, draftVenueId)}
            </div>
          </div>

          <div className="text-sm text-neutral-700">
            日付/会場を変更すると、現在の応募・オファー・承認はすべて無効になり、応募前の状態に戻ります。
            （応募期限は自動では変更されません）
          </div>

          <div className="flex gap-2 justify-end">
            <button
              className="rounded-md border px-3 py-2"
              disabled={isPending}
              onClick={() => setShowConfirm(false)}
            >
              戻る
            </button>
            <button
              className="rounded-md border px-3 py-2"
              disabled={isPending}
              onClick={onConfirmSave}
            >
              変更を確定
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function formatJaDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function toDatetimeLocalValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocalValue(v: string) {
  // datetime-local はタイムゾーン無し。ユーザー環境のローカル時刻として Date 化 → ISO へ
  // ここは運用方針次第で調整（UTC保存ならOK、JST固定ならサーバ側で補正など）
  const d = new Date(v);
  return d.toISOString();
}

function venueName(venues: {id: string; name: string}[], id: string) {
  return venues.find(v => v.id === id)?.name ?? "—";
}
