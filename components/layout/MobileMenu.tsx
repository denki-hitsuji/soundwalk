"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type NavItem = {
  label: string;
  href: string;
  requiresAuth?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "トップ", href: "/musician", requiresAuth: true },
  { label: "演奏活動", href: "/musician/performances", requiresAuth: true },
  { label: "出演名義（アクト）", href: "/musician/acts" },
  { label: "企画管理", href: "/musician/organized-events", requiresAuth: true },
  { label: "会場管理", href: "/venue", requiresAuth: true },
  { label: "マップ", href: "/map" },
];

export function MobileMenu({ userId }: { userId: string | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAuthed = !!userId;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        aria-label="メニュー"
        onClick={() => setOpen(true)}
        className="rounded border p-2 hover:bg-gray-50"
      >
        ☰
      </button>

      {/* オーバーレイ */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
      )}

      {/* メニュー本体 */}
      {open && (
        <aside className="fixed right-0 top-0 z-50 h-full w-72 bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">soundwalk</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              const locked = item.requiresAuth && !isAuthed;

              return (
                <Link
                  key={item.href}
                  href={locked ? "/login" : item.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "flex items-center justify-between rounded px-3 py-2 text-sm",
                    active ? "bg-gray-100" : "hover:bg-gray-50",
                    locked ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <span>{item.label}</span>
                  {locked && <span className="text-xs">🔒</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t pt-4">
            {isAuthed ? (
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-600"
              >
                ログアウト
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="text-sm text-blue-600 underline underline-offset-2"
              >
                ログイン / 新規登録
              </Link>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
