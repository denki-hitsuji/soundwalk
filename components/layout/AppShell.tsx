"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MobileMenu } from "./MobileMenu";
import { ActSwitcher } from "@/components/acts/ActSwitcher";

// ===== nav 定義 =====
type NavItem = {
  label: string;
  href: string;
  requiresAuth?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "トップ", href: "/musician" , requiresAuth: true },         // ダッシュボード
  { label: "演奏活動", href: "/musician/performances", requiresAuth: true },
  { label: "出演名義（アクト）", href: "/musician/acts" , requiresAuth: true },
  { label: "企画管理", href: "/musician/organized-events", requiresAuth: true },
  { label: "会場管理", href: "/venue", requiresAuth: true },           // 将来ここを統合するなら置換
  { label: "マップ", href: "/map", requiresAuth: false },
];

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function AuthInviteBanner() {
  return (
    <div className="rounded-lg border bg-white px-3 py-2 text-xs text-gray-700">
      👋 soundwalk は、ライブ予定やフライヤー、入り時間をまとめておく道具です。
      <span className="ml-2">
        <Link href="/login" className="text-blue-600 underline underline-offset-2">
          ログイン
        </Link>
        すると、自分のタイムラインが作れます。
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const isAuthed = !!userId;

  // session 取得（初回 + 変更追従）
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const visibleNav = useMemo(() => {
    // 未ログインでも “存在” は見せたいので、ここではフィルタしない（disabled表示）
    return NAV_ITEMS;
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // 「今いるページが auth 必須なのに未ログイン」なら、ページ側で usermissing を出す想定。
  // AppShell は “共通の招待” だけ薄く出す（強制リダイレクトしない）
  const shouldShowInvite =
    !isAuthed && pathname !== "/login" && pathname !== "/";

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="font-semibold tracking-tight">
            soundwalk
          </Link>

          <div className="flex items-center gap-3">
            <ActSwitcher />
            {/* 既存: ログアウトなど */}
          </div>
          <div className="flex items-center gap-2">
            {/* モバイルのみ */}
            <div className="md:hidden">
              <MobileMenu userId={userId} />
            </div>
            {/* PC用ログアウト（既存） */}
            <div className="hidden md:block">
              {isAuthed ? (
                <button
                  onClick={handleLogout}
                  className="rounded border px-3 py-1.5 text-xs"
                >
                  ログアウト
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white"
                >
                  ログイン
                </Link>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Layout */}
      <div className="mx-auto max-w-5xl px-4 py-4 grid gap-4 md:grid-cols-[220px_1fr]">
        {/* Sidebar（PC） */}
        <aside className="hidden md:block">
          <nav className="space-y-1">
            {visibleNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const locked = item.requiresAuth && !isAuthed;

              return (
                <Link
                  key={item.href}
                  href={locked ? "/login" : item.href}
                  className={classNames(
                    "flex items-center justify-between rounded px-3 py-2 text-sm border bg-white hover:bg-gray-50",
                    active && "border-gray-300",
                    locked && "opacity-60"
                  )}
                >
                  <span>{item.label}</span>
                  {locked && <span className="text-xs text-gray-400">🔒</span>}
                </Link>
              );
            })}
          </nav>

          {shouldShowInvite && (
            <div className="mt-3">
              <AuthInviteBanner />
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="space-y-4">
          {/* モバイル用：上部に簡易ナビ（ハンバーガーはあなたの既存実装に合わせて差し替えOK） */}
          <div className="md:hidden space-y-2">
            <div className="flex gap-2 overflow-x-auto">
              {visibleNav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const locked = item.requiresAuth && !isAuthed;

                return (
                  <Link
                    key={item.href}
                    href={locked ? "/login" : item.href}
                    className={classNames(
                      "shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs",
                      active && "border-gray-300",
                      locked && "opacity-60"
                    )}
                  >
                    {item.label}{locked ? " 🔒" : ""}
                  </Link>
                );
              })}
            </div>

            {shouldShowInvite && <AuthInviteBanner />}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
