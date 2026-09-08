import Link from "next/link";
import type { ReactNode } from "react";

export function PublicPage({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-stone-50 text-slate-900">
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">Soundwalk<span className="text-emerald-700">.</span></Link>
        <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">ログイン</Link>
      </div>
    </header>
    <main id="main" className="mx-auto max-w-4xl px-6 py-12 sm:py-16">{children}</main>
    <footer className="border-t border-stone-200">
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-8 text-sm text-slate-600">
        <nav aria-label="サービス情報" className="flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/" className="underline underline-offset-4">ホーム</Link>
          <Link href="/privacy" className="underline underline-offset-4">プライバシーポリシー</Link>
          <Link href="/terms" className="underline underline-offset-4">利用規約</Link>
          <Link href="/privacy#contact" className="underline underline-offset-4">お問い合わせ</Link>
        </nav>
        <p>Soundwalk — ライブや演奏の予定を、ひとつの場所に。</p>
      </div>
    </footer>
  </div>;
}

export function PolicySection({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return <section id={id} className="space-y-3">
    <h2 className="text-lg font-bold">{title}</h2>
    <div className="space-y-3 text-sm leading-7 text-slate-700 [&_a]:text-emerald-800 [&_a]:underline [&_li]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
  </section>;
}
