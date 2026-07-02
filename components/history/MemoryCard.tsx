"use client";

import type { Memory, Narration } from "@/lib/utils/history";

type Props = {
  memory: Memory;
  narration: Narration;
};

export default function MemoryCard({ memory, narration }: Props) {
  const thumbs = memory.thumbnails.slice(0, 3);
  const rest = memory.thumbnails.length - thumbs.length;

  return (
    <article className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="p-4 pb-0">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
          <span aria-hidden>✨</span>
          メモリー
        </span>
      </div>

      {memory.coverAttachment ? (
        <div className="mt-3 px-4">
          <img
            src={memory.coverAttachment.file_url}
            alt={memory.coverAttachment.caption ?? `${memory.label}のフライヤー`}
            loading="lazy"
            className="h-[150px] w-full rounded-lg object-cover"
          />
        </div>
      ) : (
        <div className="mt-3 px-4">
          <div className="flex h-[150px] w-full flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-gray-400">
            <span className="text-2xl" aria-hidden>
              🖼
            </span>
            <span className="text-[11px]">この季節のフライヤー</span>
          </div>
        </div>
      )}

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-gray-900">{narration.title}</h3>
          <div className="mt-1 space-y-0.5">
            {narration.lines.map((line, i) => (
              <p key={i} className="font-serif text-sm leading-relaxed text-gray-600">
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
            <div className="text-base font-semibold text-gray-800">{memory.count}回</div>
            <div className="text-[11px] text-gray-500">ステージに立った</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
            <div className="text-base font-semibold text-gray-800">{memory.venueCount}</div>
            <div className="text-[11px] text-gray-500">巡った場所</div>
          </div>
        </div>

        {thumbs.length > 0 && (
          <div className="flex items-center gap-2">
            {thumbs.map((a, i) => (
              <img
                key={`${a.file_url}-${i}`}
                src={a.file_url}
                alt={a.caption ?? ""}
                loading="lazy"
                className="h-14 w-14 rounded-md object-cover"
              />
            ))}
            {rest > 0 && (
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-100 text-xs font-medium text-gray-500">
                +{rest}
              </div>
            )}
          </div>
        )}

        {/* v2: ここに「よく鳴らした曲」（setlists / setlist_items 由来）のセクションを差し込む */}

        <a
          href="#history-map"
          className="inline-flex items-center gap-1 text-xs text-gray-500 underline-offset-2 hover:underline"
        >
          <span aria-hidden>📍</span>
          この季節の軌跡を地図で見る
        </a>
      </div>
    </article>
  );
}
