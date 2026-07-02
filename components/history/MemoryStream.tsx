"use client";

import type { Memory, Narration } from "@/lib/utils/history";
import MemoryCard from "./MemoryCard";

type Props = {
  memories: { memory: Memory; narration: Narration }[];
};

export default function MemoryStream({ memories }: Props) {
  if (memories.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">この頃の私たち</h2>
      <div className="space-y-4">
        {memories.map(({ memory, narration }) => (
          <MemoryCard key={memory.key} memory={memory} narration={narration} />
        ))}
      </div>
    </section>
  );
}
