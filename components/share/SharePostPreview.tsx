"use client";

import { useState, useCallback } from "react";

type Props = {
  text: string;
  /** セクション見出し（省略時: "SNS告知文"） */
  title?: string;
  /** true にすると外側の section ラッパーを省略する */
  bare?: boolean;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function SharePostPreview({ text, title = "SNS告知文", bare = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=&text=${encodeURIComponent(text)}`;

  const content = (
    <>
      {!bare && <h2 className="text-sm font-semibold">{title}</h2>}

      <div className="rounded-lg border bg-gray-50 px-3 py-2">
        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
          {text}
        </pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={`inline-flex items-center rounded px-3 py-1.5 text-xs font-medium text-white transition-colors ${
            copied ? "bg-emerald-600" : "bg-slate-900 hover:bg-slate-700"
          }`}
        >
          {copied ? "コピーしました" : "告知文をコピー"}
        </button>

        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          X で共有
        </a>

        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded border border-green-400 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
        >
          LINE で共有
        </a>
      </div>
    </>
  );

  if (bare) {
    return <div className="space-y-3">{content}</div>;
  }

  return (
    <section className="rounded-xl border bg-white px-4 py-3 shadow-sm space-y-3">
      {content}
    </section>
  );
}
