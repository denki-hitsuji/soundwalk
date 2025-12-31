"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TemplateAssist from "@/components/forms/TemplateAssist";
import { makeSongMemoTemplate } from "@/lib/templates";

export default function SongMemoEditor({ initialText }: { initialText: string | null }) {
  const [text, setText] = useState(initialText ?? "");
  const didInit = useRef(false);

  const templateText = useMemo(() => makeSongMemoTemplate(), []);

  // ★ 空のときだけ、初回だけ、自動でテンプレを入れる
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (!text.trim()) {
      setText(templateText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateText]);

  return (
    <div className="space-y-2">
      <TemplateAssist
        templateText={templateText}
        getValue={() => text}
        setValue={setText}
      />

      <textarea
        className="w-full rounded border px-3 py-2 text-sm min-h-[200px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
