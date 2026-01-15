"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TemplateAssist from "@/components/forms/TemplateAssist";
import { makeSongMemoTemplate } from "@/lib/utils/templates";

type Props = {
  initialText: string | null;
  // 後で保存を繋ぐなら追加
  onSave?: (nextText: string) => Promise<void> | void;
};

function linkifyText(text: string) {
  // http/https のみリンク化（安全側）
  const urlRe = /(https?:\/\/[^\s)>\]]+)/g;

  const parts: Array<string | { url: string }> = [];
  let last = 0;

  for (const m of text.matchAll(urlRe)) {
    const idx = m.index ?? 0;
    const url = m[0];

    if (idx > last) parts.push(text.slice(last, idx));
    parts.push({ url });
    last = idx + url.length;
  }

  if (last < text.length) parts.push(text.slice(last));

  return parts.map((p, i) => {
    if (typeof p === "string") return <span key={i}>{p}</span>;
    return (
      <a
        key={i}
        href={p.url}
        target="_blank"
        rel="noreferrer"
        className="text-blue-700 underline underline-offset-2 break-all"
      >
        {p.url}
      </a>
    );
  });
}

export default function SongMemoEditor({ initialText, onSave }: Props) {
  if (!onSave) throw Error("onSaveは必ず指定してください");
  const [mode, setMode] = useState<"view" | "edit">("view");

  // 編集中の値（編集中だけ textarea が触る）
  const [text, setText] = useState(initialText ?? "");

  // 閲覧表示に使う「保存済み（とみなす）値」
  // ここでは initialText を起点に、編集キャンセルで戻すために保持
  const [committedText, setCommittedText] = useState(initialText ?? "");

  const didInit = useRef(false);
  const templateText = useMemo(() => makeSongMemoTemplate(), []);

  // ★ 空のときだけ、初回だけ、自動でテンプレを入れる（編集値に対して）
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // 初期が空ならテンプレを仕込む（編集で初めて開いた時にすぐ書ける）
    if (!text.trim()) {
      setText(templateText);
      // committed は「保存済み」ではないので触らない
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateText]);

  // 初期値が親から変わったとき（曲切替など）に追従
  useEffect(() => {
    const next = initialText ?? "";
    setCommittedText(next);
    setText(next || (!didInit.current ? text : next)); // 雑に上書きしない保険
    setMode("view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  const startEdit = () => {
    setText(committedText || text);
    setMode("edit");
  };

  const cancelEdit = () => {
    setText(committedText);
    setMode("view");
  };

  // ★ ここでは「保存＝コミット」まで（DB保存は親で繋ぐ想定）
  const saveEdit = async () => {
    // ここに onSave を繋ぐならここで await onSave(text)
    console.log("before saveEdit: " + text);
    await onSave(text);
    setCommittedText(text);
    setMode("view");
  };

  if (mode === "view") {
    const hasText = committedText.trim().length > 0;

    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">メモ</h2>
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            編集
          </button>
        </div>

        <div className="rounded border bg-white px-3 py-2 text-sm text-gray-700 whitespace-pre-wrap h-full min-h-[60vh]">
          {hasText ? (
            linkifyText(committedText)
          ) : (
            <span className="text-gray-400">メモはまだありません。</span>
          )}
        </div>
      </div>
    );
  }

  // edit mode
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-gray-500">メモ（編集中）</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => void saveEdit()}
            className="rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
          >
            保存
          </button>
        </div>
      </div>

      <TemplateAssist templateText={templateText} getValue={() => text} setValue={setText} />

      <textarea
        className="w-full rounded border px-3 py-2 text-sm min-h-[240px] max-h-[50vh"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
