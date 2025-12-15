// components/layout/AppShell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import LogoutButton from "@/components/layout/LogoutButton";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/dashboard", label: "トップ" },
  { href: "/musician", label: "演奏活動" },
  { href: "/organizer", label: "企画管理" },
  { href: "/venue", label: "会場管理" },
  { href: "/map", label: "マップ" }, // ← 追加
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/musician" className="font-semibold">
            soundwalk
          </Link>
          ※ これは開発途中のデモです（スマホ推奨）

          {/* デスクトップナビ */}
          <nav className="hidden md:flex items-center gap-3 text-xs">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={
                  "px-2 py-1 rounded transition-colors " +
                  (isActive(item.href)
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100")
                }
              >
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>

          {/* モバイル：ハンバーガー */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded border px-2 py-1 text-xs text-gray-700"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="メニュー"
            aria-expanded={menuOpen}
          >
            <span className="mr-1">メニュー</span>
            <span className="flex flex-col gap-[3px]">
              <span className="block h-[2px] w-4 bg-gray-700" />
              <span className="block h-[2px] w-4 bg-gray-700" />
              <span className="block h-[2px] w-4 bg-gray-700" />
            </span>
          </button>
        </div>

        {/* モバイルナビ（開閉） */}
        {menuOpen && (
          <nav className="md:hidden border-t bg-white">
            <div className="mx-auto max-w-5xl px-4 py-2 flex flex-col gap-1 text-xs">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={
                    "block rounded px-2 py-1 transition-colors " +
                    (isActive(item.href)
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100")
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* メインコンテンツ */}
      <div className="mx-auto max-w-5xl py-4 px-4">{children}</div>
    </div>
  );
}
