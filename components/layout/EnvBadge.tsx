"use client";

const ENV = process.env.NEXT_PUBLIC_APP_ENV;

export function EnvBadge() {
  // ✅ 本番では一切表示しない
  if (!ENV || ENV === "prod") return null;

  const color =
    ENV === "staging"
      ? "bg-yellow-500"
      : "bg-green-600"; // local / dev

  return (
    <div
      className={`fixed bottom-3 right-3 z-[9999] px-3 py-1 rounded text-xs font-mono text-white shadow ${color}`}
    >
      ENV: {ENV}
    </div>
  );
}
