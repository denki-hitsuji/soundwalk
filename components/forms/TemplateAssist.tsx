// components/forms/TemplateAssist.tsx
"use client";

import { useState } from "react";

type Props = {
  templateText: string;
  getValue: () => string;
  setValue: (next: string) => void;
};

export default function TemplateAssist({ templateText, getValue, setValue }: Props) {
  const [msg, setMsg] = useState<string | null>(null);

  const insertTemplate = () => {
    const cur = getValue();
    if (!cur.trim()) {
      setValue(templateText);
      setMsg("テンプレを入れました");
      return;
    }

    // 既に何かある場合は末尾に追記（安全）
    const glued = cur.endsWith("\n") ? cur : cur + "\n\n";
    setValue(glued + templateText);
    setMsg("テンプレを追記しました");
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(templateText);
      setMsg("テンプレをコピーしました");
    } catch {
      setMsg("コピーに失敗しました（ブラウザ権限を確認）");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={insertTemplate}
        className="rounded border bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
      >
        テンプレ挿入
      </button>

      <button
        type="button"
        onClick={copyTemplate}
        className="rounded border bg-white px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
      >
        テンプレをコピー
      </button>

      {msg && <span className="text-[11px] text-gray-500">{msg}</span>}
    </div>
  );
}
