'use client';
import { useRouter } from 'next/navigation';

export function BackLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-blue-600 hover:underline text-xs mb-3"
    >
      ← 前の画面に戻る
    </button>
  );
}
