"use client";

const ENV = process.env.NEXT_PUBLIC_APP_ENV;

export function EnvBadge() {
  if (!ENV) return null;

  const color =
    ENV === "prod"
      ? "bg-red-600"
      : ENV === "staging"
      ? "bg-yellow-500"
      : "bg-green-600";

  return (
    <div
      className={`fixed bottom-3 right-3 z-[9999] px-3 py-1 rounded text-xs font-mono text-white shadow ${color}`}
    >
      ENV: {ENV}
    </div>
  );
}
