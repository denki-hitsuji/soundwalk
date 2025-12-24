// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserRole } from '@/lib/authRole';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soundwalk",
  description: "街に音楽が溢れるためのアプリ",
};
export default function Home() {
  const router = useRouter();

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold"><a href="/">soundwalk</a></h1>
<div className="rounded-lg border bg-white p-4 space-y-3">
  <p className="text-sm">
    👋 soundwalk は、
    ライブや演奏の予定をまとめておけるツールです。
  </p>

  <p className="text-sm text-gray-600">
    まずはログインして、すでに決まっているライブを
    1件だけ登録してみてください。
  </p>

  <Link
    href="/login"
    className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
  >
    ログイン / 新規登録
  </Link>
</div>

    </main>
  );
}
