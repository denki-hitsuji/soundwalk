"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { MobileMenu } from "./MobileMenu";
import { signOut } from "@/lib/auth/session.client";
import { NAV_ITEMS } from "./NavItems";
import { EnvBadge } from "./EnvBadge";


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

export function AppShellClient({
  children,
  initialUserId,
}: {
  children: React.ReactNode;
  initialUserId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Serverで確定した値を初期値に使う
  const [userId, setUserId] = useState<string | null>(initialUserId);
  const isAuthed = !!userId;

  // ✅ 変更追従だけClientでやる（初回取得をここで頑張らない）
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event : any, session : any) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const visibleNav = useMemo(() => NAV_ITEMS, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const shouldShowInvite = !isAuthed && pathname !== "/login" && pathname !== "/";

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="font-semibold tracking-tight">
            {process.env.NEXT_PUBLIC_APP_ENV === "prod"
              ? "Soundwalk"
              : `Soundwalk [${process.env.NEXT_PUBLIC_APP_ENV}]`
            }
          </Link>

          <div className="flex items-center gap-3">{/* 予約枠 */}</div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <MobileMenu userId={userId} />
            </div>

            <div className="hidden md:block">
              {isAuthed ? (
                <button onClick={handleLogout} className="rounded border px-3 py-1.5 text-xs">
                  ログアウト
                </button>
              ) : (
                <Link href="/login" className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white">
                  ログイン
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-4 grid gap-4 md:grid-cols-[220px_1fr]">
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

        <main className="p-4 w-full max-w-full overflow-x-hidden">
          <div className="mx-auto max-w-3xl min-w-0 md:hidden space-y-2">
            {shouldShowInvite && <AuthInviteBanner />}
          </div>

          {children}
          <EnvBadge />
        </main>
      </div>
    </div>
  );
}
