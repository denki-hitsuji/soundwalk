// components/flyers/FlyerSection.tsx
"use client";

import { FlyerItem } from "@/lib/utils/eventAttachments";

type Props = {
  // 表示するフライヤー一覧
  flyers: FlyerItem[];
  // アップロード可能か
  canUpload: boolean;
  // アップロード中フラグ
  uploading: boolean;
  // アップロードハンドラ
  onUpload: (file: File) => Promise<void>;
  // 削除ハンドラ
  onDelete?: (flyer: FlyerItem) => Promise<void>;
  // 全てのフライヤーを削除可能にするか（企画ページ用）
  canDeleteAll?: boolean;
  // 空の時のメッセージ
  emptyMessage?: string;
  // セクションタイトル
  title?: string;
};

export function FlyerSection({
  flyers,
  canUpload,
  uploading,
  onUpload,
  onDelete,
  canDeleteAll = false,
  emptyMessage = "フライヤーはまだ登録されていません。",
  title = "フライヤー",
}: Props) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void onUpload(file);
    e.currentTarget.value = "";
  };

  return (
    <section className="rounded-xl border bg-white px-4 py-3 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        {canUpload && (
          <label className="inline-flex items-center rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white cursor-pointer">
            {uploading ? "アップロード中..." : "画像を追加"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {flyers.length === 0 ? (
        <p className="text-xs text-gray-600">{emptyMessage}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {flyers.map((f) => (
            <div key={f.id} className="rounded border overflow-hidden">
              <a href={f.file_url} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.file_url}
                  alt="flyer"
                  className="w-full h-40 object-cover"
                />
              </a>
              <div className="p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">
                    {new Date(f.created_at).toLocaleDateString()}
                  </span>
                  {f.source === "event" && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                      企画者
                    </span>
                  )}
                </div>
                {onDelete && (canDeleteAll || f.source === "performance") && (
                  <button
                    type="button"
                    onClick={() => void onDelete(f)}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
