"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
  description: string | null;         // プロフィール文
  photo_url: string | null;           // 写真
  profile_link_url: string | null;    // リンク1本
  owner_profile_id: string;
};

type Props = {
  act: ActRow;
  onUpdated?: (patch: Partial<ActRow>) => void;
};

export function ActProfileEditor({ act, onUpdated }: Props) {
  const [photoUrl, setPhotoUrl] = useState(act.photo_url ?? "");
  const [desc, setDesc] = useState(act.description ?? "");
  const [link, setLink] = useState(act.profile_link_url ?? "");
  useEffect(() => {
    setPhotoUrl(act.photo_url ?? "");
    setDesc(act.description ?? "");
    setLink(act.profile_link_url ?? "");
  }, [act.photo_url, act.description, act.profile_link_url]);
  useEffect(() => {
  console.log("child act prop changed", act.id, act.description);
}, [act.id, act.description]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const norm = (v: string | null | undefined) => (v ?? "").trim();
  const changed = useMemo(() => {
    return (
      norm(photoUrl) !== norm(act.photo_url) ||
      norm(desc) !== norm(act.description) ||
      norm(link) !== norm(act.profile_link_url)
    );
  }, [photoUrl, desc, link, act.photo_url, act.description, act.profile_link_url]);

  const debug = () => {
    console.log({
      photoUrl,
      desc,
      link,
      actPhoto: act.photo_url,
      actDesc: act.description,
      actLink: act.profile_link_url,
    });
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${act.id}/${filename}`;

      const { error: upErr } = await supabase.storage
        .from("act-photos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/png",
        });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from("act-photos").getPublicUrl(path);
      const url = data.publicUrl;

      setPhotoUrl(url);
      onUpdated?.({ photo_url: url });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const patch = {
        photo_url: photoUrl.trim() ? photoUrl.trim() : null,
        description: desc.trim() ? desc.trim() : null,
        profile_link_url: link.trim() ? link.trim() : null,
      };

      const { error } = await supabase.from("acts").update(patch).eq("id", act.id);
      if (error) throw error;
      // DBに入った形（trim + null）に UI state も揃える
      setPhotoUrl(patch.photo_url ?? "");
      setDesc(patch.description ?? "");
      setLink(patch.profile_link_url ?? "");

      debug();
      onUpdated?.({
        photo_url: patch.photo_url,
        description: patch.description,
        profile_link_url: patch.profile_link_url,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border bg-gray-50 p-3 space-y-3">
      <div className="text-xs font-semibold text-gray-700">プロフィール</div>

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
          <label className="block text-[11px] text-gray-600">
            写真をアップロード（1枚）
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPhoto(f);
              }}
              className="mt-1 block w-full text-xs"
            />
          </label>

          {uploading && <div className="text-[11px] text-gray-500">アップロード中…</div>}
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

      <div className="flex items-center justify-end gap-2">
        {changed && <span className="text-[11px] text-gray-500">未保存の変更があります</span>}
        <button
          type="button"
          disabled={!changed || saving || uploading}
          onClick={() => void save()}
          className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {saving ? "保存中…" : "保存"}
        </button>
      </div>
    </div>
  );
}
