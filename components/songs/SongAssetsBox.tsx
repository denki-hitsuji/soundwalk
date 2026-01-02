"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listSongAssets,
  uploadSongAsset,
  deleteSongAsset,
  getSignedUrl,
  validateSongAssetFile,
  type SongAssetRow,
  SONG_ASSET_MAX_BYTES,
} from "@/lib/db/songAssets";

function fmtBytes(n: number) {
  if (n < 1024) return `${n}B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)}MB`;
}

export default function SongAssetsBox({ actSongId }: { actSongId: string }) {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<SongAssetRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<"score" | "lyrics" | "demo" | "guide" | "click" | "other">("score");

  // private bucketなので、表示用URLはsignedUrlを都度作る
  const [signedMap, setSignedMap] = useState<Record<string, string>>({});

  const accept = useMemo(
    () => [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      ".pdf,.jpg,.jpeg,.png,.webp,.mp3",
    ].join(","),
    [],
  );
const kindLabel: Record<string,string> = {
  score: "譜面",
  demo: "デモ",
  guide: "ガイド",
  click: "クリック",
  lyrics: "歌詞",
  other: "その他",
};

  const reload = async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await listSongAssets(actSongId);
      setAssets(list);

      // 直近分だけ署名URL作る（多すぎるとAPI叩きすぎるので必要なら後で最適化）
      const next: Record<string, string> = {};
      for (const a of list) {
        try {
          next[a.id] = await getSignedUrl(a.object_path, 60 * 10);
        } catch {
          // 署名作成に失敗しても一覧自体は見せる
        }
      }
      setSignedMap(next);
    } catch (e: any) {
      setErr(e?.message ?? "添付ファイルの取得に失敗しました。");
      setAssets([]);
      setSignedMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actSongId]);

  const onPick = (f: File | null) => {
    setErr(null);
    setFile(null);
    if (!f) return;
    const msg = validateSongAssetFile(f);
    if (msg) {
      setErr(msg);
      return;
    }
    setFile(f);
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const inserted = await uploadSongAsset({ actSongId, file, assetKind: kind });
      setFile(null);

      // 追加分だけ先に差し込む
      setAssets((prev) => [inserted, ...prev]);
      try {
        const url = await getSignedUrl(inserted.object_path, 60 * 10);
        setSignedMap((prev) => ({ ...prev, [inserted.id]: url }));
      } catch {}
    } catch (e: any) {
      setErr(e?.message ?? "アップロードに失敗しました。");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (a: SongAssetRow) => {
    const ok = window.confirm(`「${a.original_filename}」を削除しますか？`);
    if (!ok) return;

    setErr(null);
    try {
      await deleteSongAsset(a);
      setAssets((prev) => prev.filter((x) => x.id !== a.id));
      setSignedMap((prev) => {
        const n = { ...prev };
        delete n[a.id];
        return n;
      });
    } catch (e: any) {
      setErr(e?.message ?? "削除に失敗しました。");
    }
  };

  return (
    <section className="rounded border bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">譜面・音源（添付）</h2>
          <p className="text-[11px] text-gray-600 mt-1">
            最大 {fmtBytes(SONG_ASSET_MAX_BYTES)} / 動画NG / 音声はmp3のみ
          </p>
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      {/* uploader */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
           <select
               className="rounded border px-2 py-1 text-sm"
               value={kind}
               onChange={(e) => setKind(e.target.value as any)}
           >
               <option value="score">譜面</option>
               <option value="demo">デモ</option>
               <option value="guide">ガイド</option>
               <option value="click">クリック</option>
               <option value="lyrics">歌詞</option>
               <option value="other">その他</option>
          </select>
          <input
            type="file"
            accept={accept}
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            className="block w-full text-sm rounded border px-2 py-1"
          />
          <button
            type="button"
            disabled={!file || uploading}
            onClick={() => void onUpload()}
            className={[
              "inline-flex justify-center rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white",
              (!file || uploading) ? "opacity-50" : "hover:bg-blue-700",
            ].join(" ")}
          >
            {uploading ? "アップロード中…" : "アップロード"}
          </button>
        </div>

        {file && (
          <div className="text-[11px] text-gray-600">
            選択中: <span className="font-mono">{file.name}</span>（{fmtBytes(file.size)}）
          </div>
        )}
      </div>

      {/* list */}
      {loading ? (
        <div className="text-sm text-gray-500">読み込み中…</div>
      ) : assets.length === 0 ? (
        <div className="text-sm text-gray-600">まだ添付がありません。</div>
      ) : (
        <ul className="space-y-2">
          {assets.map((a) => {
            const url = signedMap[a.id];
            const isAudio = a.mime_type === "audio/mpeg";
            const isImage = a.mime_type.startsWith("image/");
            const isPdf = a.mime_type === "application/pdf";

            return (
              <li key={a.id} className="rounded border px-3 py-2 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {a.original_filename}
                      <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">
                        {kindLabel[a.asset_kind] ?? a.asset_kind}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {a.mime_type} / {fmtBytes(a.size_bytes)} / {new Date(a.created_at).toLocaleString()}
                    </div>

                    {/* preview / link */}
                    {url ? (
                      <div className="mt-2 space-y-2">
                        <a className="text-xs text-blue-700 hover:underline" href={url} target="_blank" rel="noreferrer">
                          開く（署名URL）
                        </a>

                        {isAudio && (
                          <audio controls preload="none" className="w-full">
                            <source src={url} type="audio/mpeg" />
                          </audio>
                        )}

                        {isImage && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt={a.original_filename} className="max-h-56 rounded border object-contain" />
                        )}

                        {isPdf && (
                          <div className="text-[11px] text-gray-600">
                            PDFは「開く」から閲覧してください（端末差があるため埋め込みは省略）。
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-gray-500">URL生成に失敗しました（権限/期限切れの可能性）。</div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void onDelete(a)}
                    className="shrink-0 text-[11px] text-red-600 hover:underline"
                    title="削除"
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
