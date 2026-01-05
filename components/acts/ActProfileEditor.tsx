"use client";

import { useMemo, useRef, useState } from "react";
import { ActRow, deletePhotoDataAndStorage, updateAct, uploadActPhoto } from "@/lib/api/acts";

type Props = {
  act: ActRow;
  onUpdated?: (patch: Partial<ActRow>) => void;
};

export function ActProfileEditor({ act, onUpdated }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [photoUrl, setPhotoUrl] = useState(act.photo_url ?? "");
  const [desc, setDesc] = useState(act.description ?? "");
  const [link, setLink] = useState(act.profile_link_url ?? "");

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const norm = (v: string | null | undefined) => (v ?? "").trim();

  // 写真は即反映するので、changed判定からは外す（保存ボタンで扱うのは desc/link のみ）
  const changed = useMemo(() => {
    return norm(desc) !== norm(act.description) || norm(link) !== norm(act.profile_link_url);
  }, [desc, link, act.description, act.profile_link_url]);

  const cacheBust = (url: string) => {
    const v = `v=${Date.now()}`;
    return url.includes("?") ? `${url}&${v}` : `${url}?${v}`;
  };

  const uploadAndApplyPhoto = async (file: File) => {
    setErr(null);
    setUploading(true);

    // 先にローカルプレビュー（体感が良い）
    const localPreview = URL.createObjectURL(file);
    setPhotoUrl(localPreview);

    try {
      const ext = file.name.split(".").pop() || "png";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${act.id}/${filename}`;

      const publicUrl = await uploadActPhoto(act.id, file);

      // CDNキャッシュ避け（更新が反映しない時の定番原因）
      const busted = cacheBust(publicUrl);

      // ★ここが本命：DBにも即反映
      await updateAct({ id: act.id, photo_url: publicUrl });

      // UIは bust 付きで表示、DBは素のURL（次回ロードで二重?が付かない）
      setPhotoUrl(busted);
      onUpdated?.({ photo_url: publicUrl });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "アップロードに失敗しました");
      // 失敗したら元に戻す
      setPhotoUrl(act.photo_url ?? "");
    } finally {
      setUploading(false);
      // input をリセット（同じファイルを選び直せるように）
      if (fileRef.current) fileRef.current.value = "";
      // プレビューURL解放
      URL.revokeObjectURL(localPreview);
    }
  };


  const deletePhoto = async () => {
    if (!act.photo_url && !photoUrl) return;

    setErr(null);
    setDeleting(true);
    try {
      await deletePhotoDataAndStorage(act);

      setPhotoUrl("");
      onUpdated?.({ photo_url: null });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  const saveText = async () => {
    setErr(null);
    setSaving(true);
    try {
      const patch = {
        description: desc.trim() ? desc.trim() : null,
        profile_link_url: link.trim() ? link.trim() : null,
      };

      await updateAct({ id: act.id, ...patch });

      setDesc(patch.description ?? "");
      setLink(patch.profile_link_url ?? "");
      onUpdated?.(patch);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border bg-gray-50 p-3 space-y-3">

      {/* 写真 */}
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 rounded border bg-white overflow-hidden flex items-center justify-center text-[11px] text-gray-400">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="アーティスト写真" className="h-full w-full object-cover" />
          ) : (
            "写真なし"
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <label className="block text-[11px] text-gray-600">
              写真を選ぶ（選んだ瞬間にアップロード）
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                disabled={uploading || deleting}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadAndApplyPhoto(f);
                }}
                className="mt-1 block w-full text-xs"
              />
            </label>

            <button
              type="button"
              disabled={!photoUrl || uploading || deleting}
              onClick={() => void deletePhoto()}
              className="mt-5 shrink-0 rounded border px-2 py-1 text-[11px] hover:bg-gray-100 disabled:opacity-40"
              title="写真を削除"
            >
              {deleting ? "削除中…" : "削除"}
            </button>
          </div>

          {(uploading || deleting) && (
            <div className="text-[11px] text-gray-500">{uploading ? "アップロード中…" : "削除中…"}</div>
          )}
        </div>
      </div>

      {/* プロフィール文 */}
      <label className="block text-[11px] text-gray-600">
        プロフィール文（短くてOK）
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="例：茨城のロックバンド。90年代オルタナ中心。3ピース。"
          className="mt-1 w-full min-h-[84px] rounded border bg-white px-3 py-2 text-sm"
        />
      </label>

      {/* リンク */}
      <label className="block text-[11px] text-gray-600">
        プロフィールリンク（1つ）
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="例：https://lit.link/xxxxx （Instagramでも公式サイトでもOK）"
          className="mt-1 w-full rounded border bg-white px-3 py-2 text-sm"
        />
      </label>

      {err && <div className="text-[11px] text-red-600">{err}</div>}

      <div className="flex items-center justify-end gap-2">
        {changed && <span className="text-[11px] text-gray-500">未保存の変更があります</span>}
        <button
          type="button"
          disabled={!changed || saving || uploading || deleting}
          onClick={() => void saveText()}
          className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {saving ? "保存中…" : "保存（文/リンク）"}
        </button>
      </div>
    </div>
  );
}
