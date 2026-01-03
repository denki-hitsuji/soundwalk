"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type ActPublicPageRow = {
  act_id: string;
  slug: string;
  is_public: boolean;
  headline: string | null;
  body: string | null;
  updated_at?: string;
};

function slugLooksValid(s: string) {
  // twitter id っぽい: a-z0-9_ のみ、先頭は英数字、長さ3〜30
  // 必要なら緩めてOK
  return /^[a-z0-9][a-z0-9_]{2,29}$/.test(s);
}

export default function ActPublicPageEditor({
  actId,
  actName,
}: {
  actId: string;
  actName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [row, setRow] = useState<ActPublicPageRow | null>(null);

  // 新規作成用
  const [slugDraft, setSlugDraft] = useState("");

  // 編集用（row がある場合）
  const [isPublic, setIsPublic] = useState(false);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");

  const baseUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SITE_URL ??
      (typeof window !== "undefined" ? window.location.origin : ""),
    []
  );

  const publicUrl = row ? `${baseUrl}/bands/${row.slug}` : null;

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("act_public_pages")
        .select("act_id, slug, is_public, headline, body, updated_at")
        .eq("act_id", actId)
        .maybeSingle();

      if (error) throw error;

      const r = (data ?? null) as ActPublicPageRow | null;
      setRow(r);

      if (r) {
        setIsPublic(!!r.is_public);
        setHeadline(r.headline ?? "");
        setBody(r.body ?? "");
      } else {
        // 初期値：slug を actName から推測したければここで生成してもOK
        setSlugDraft("");
        setIsPublic(false);
        setHeadline("");
        setBody("");
      }
    } catch (e) {
      console.error("act_public_pages load error", e);
      setRow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actId]);

  const createPage = async () => {
    const slug = slugDraft.trim().toLowerCase();

    if (!slugLooksValid(slug)) {
      alert("slug は英小文字/数字/_ のみ、3〜30文字、先頭は英数字で指定してください。");
      return;
    }

    setSaving(true);
    try {
      // slug は不変運用なので、ここで確定して insert
      const { data, error } = await supabase
        .from("act_public_pages")
        .insert({
          act_id: actId,
          slug,
          is_public: false, // 最初は非公開で作る（事故防止）
          headline: null,
          body: null,
        })
        .select("act_id, slug, is_public, headline, body, updated_at")
        .single();

      if (error) throw error;

      const r = data as ActPublicPageRow;
      setRow(r);
      setIsPublic(!!r.is_public);
      setHeadline(r.headline ?? "");
      setBody(r.body ?? "");

      alert("公開ページの器を作成しました（まだ非公開です）。");
    } catch (e: any) {
      console.error(e);
      // slug 重複などはここに来る
      alert(e?.message ?? "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const saveEdits = async () => {
    if (!row) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("act_public_pages")
        .update({
          is_public: isPublic,
          headline: headline.trim() ? headline.trim() : null,
          body: body.trim() ? body : null,
        })
        .eq("act_id", actId)
        .select("act_id, slug, is_public, headline, body, updated_at")
        .single();

      if (error) throw error;
      setRow(data as ActPublicPageRow);
      alert("保存しました。");
    } catch (e: any) {
      console.error(e);
      alert(e?.message ?? "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      alert("URLをコピーしました。");
    } catch {
      // clipboard が使えない環境用
      prompt("コピーしてください", publicUrl);
    }
  };

  if (loading) {
    return <div className="rounded border bg-white p-3 text-sm text-gray-500">公開ページ情報を読み込み中…</div>;
  }

  return (
    <section className="rounded border bg-white p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">公開ページ</div>
          <div className="text-[11px] text-gray-600">
            プロフィールと今後のライブ予定を、URLで共有できます（offeredは公開ページでは除外）。
          </div>
        </div>
      </div>

      {!row ? (
        <div className="space-y-2">
          <div className="text-[11px] text-gray-600">まず slug を決めて公開ページを作成します（後から変更不可）。</div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="text-[11px] text-gray-500 mb-1">slug</div>
              <input
                value={slugDraft}
                onChange={(e) => setSlugDraft(e.target.value)}
                placeholder="例: the_holidays"
                className="w-full rounded border px-3 py-2 text-sm"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              <div className="mt-1 text-[11px] text-gray-500">
                英小文字/数字/_、3〜30文字。URLは <span className="font-mono">{baseUrl}/bands/&lt;slug&gt;</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void createPage()}
              disabled={saving}
              className={[
                "shrink-0 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white",
                saving ? "opacity-60" : "hover:bg-blue-700",
              ].join(" ")}
            >
              {saving ? "作成中…" : "公開ページを作る"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* URL表示 */}
          <div className="rounded border bg-gray-50 p-2">
            <div className="text-[11px] text-gray-600">公開URL</div>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-sm font-mono break-all">{publicUrl}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyUrl()}
                  className="rounded border bg-white px-2 py-1 text-[11px] hover:bg-gray-50"
                >
                  コピー
                </button>
                <a
                  href={publicUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border bg-white px-2 py-1 text-[11px] hover:bg-gray-50"
                >
                  開く
                </a>
              </div>
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              slug: <span className="font-mono">{row.slug}</span>（変更不可）
            </div>
          </div>

          {/* 公開ON/OFF */}
          <label className="flex items-center gap-2">
            公開：
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <span className="text-[11px] text-gray-600">
              {isPublic ? "公開する（誰でも閲覧可）" : "非公開（URLを知っていても表示されない）"}
            </span>
          </label>

          {/* 公開用プロフィール（案B） */}
          <div className="space-y-2">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">見出し（任意）</div>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="例：茨城を拠点に活動するロックバンド"
              />
            </div>

            <div>
              <div className="text-[11px] text-gray-500 mb-1">本文（任意）</div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm min-h-[140px]"
                placeholder="バンド紹介、サウンドの特徴、連絡先など"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void saveEdits()}
              disabled={saving}
              className={[
                "rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white",
                saving ? "opacity-60" : "hover:bg-blue-700",
              ].join(" ")}
            >
              {saving ? "保存中…" : "保存"}
            </button>

            <button
              type="button"
              onClick={() => void load()}
              disabled={saving}
              className="rounded border bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              再読込
            </button>
          </div>

          <div className="text-[11px] text-gray-500">
            ※ 公開ページは is_public=true のときだけ表示されます。
          </div>
        </div>
      )}
    </section>
  );
}
