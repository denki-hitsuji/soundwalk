import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage } from "@/components/public/PublicPage";

export const metadata: Metadata = {
  title: "Soundwalk | ライブや演奏の予定を、ひとつの場所に",
  description: "Soundwalkはミュージシャンのライブ予定、出演名義、会場、フライヤーや準備事項をまとめて管理するサービスです。Googleカレンダーのライブ予定から登録できます。",
  alternates: { canonical: "https://soundwalk.net/" },
};

export default function Home() {
  return <PublicPage>
    <section className="max-w-2xl space-y-6">
      <p className="text-sm font-semibold tracking-widest text-emerald-800">音楽を続ける人の、予定と記録。</p>
      <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">次のライブを、<br />ひとつの場所に。</h1>
      <p className="text-base leading-8 text-slate-600">Soundwalkは、ミュージシャンのライブや演奏の予定をまとめて管理するサービスです。出演名義、会場、日付、フライヤー、準備事項を整理して、演奏に向けた段取りを確認できます。</p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/login" className="rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white">Googleアカウントではじめる</Link>
        <Link href="/musician" className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold">ライブ予定を開く</Link>
      </div>
    </section>
    <section aria-label="Soundwalkでできること" className="my-14 grid gap-4 sm:grid-cols-3">
      {[
        ["01", "ライブをまとめる", "日付・会場・出演名義を登録し、これからの予定と過去のライブを振り返れます。"],
        ["02", "準備を見渡す", "フライヤーやメモ、入り時間、準備事項をライブごとに確認できます。"],
        ["03", "仲間と共有する", "出演名義のメンバーと予定を管理し、公開設定したライブ情報を届けられます。"],
      ].map(([number, title, text]) => <article key={number} className="rounded-2xl border border-stone-200 bg-white p-6">
        <p className="text-sm font-semibold text-emerald-800">{number}</p>
        <h2 className="mb-3 mt-5 text-lg font-bold">{title}</h2>
        <p className="text-sm leading-7 text-slate-600">{text}</p>
      </article>)}
    </section>
    <section className="space-y-4 rounded-2xl bg-emerald-950 p-7 text-white sm:p-9">
      <h2 className="text-2xl font-bold">Googleカレンダーの予定から、ライブ登録へ。</h2>
      <p className="text-sm leading-7 text-emerald-50">カレンダー連携では、選択したGoogleアカウントの予定を読み取り、予定名に「ライブ」を含むイベントと、Soundwalkの同じ日の登録状況を並べて確認できます。登録したい予定を選ぶと、日付・場所・メモを引き継いで新規登録できます。</p>
      <p className="text-sm leading-7 text-emerald-50">連携は任意です。ログインとは別のGoogleアカウントを選択でき、Googleカレンダーへの書き込み・変更・削除は行いません。取得情報の用途と保存方法はプライバシーポリシーをご確認ください。</p>
      <Link href="/privacy#google" className="inline-block text-sm font-medium underline underline-offset-4">Googleユーザーデータの取り扱い</Link>
    </section>
    <p className="mt-10 text-sm leading-7 text-slate-600">ご利用前に<Link href="/terms" className="text-emerald-800 underline">利用規約</Link>と<Link href="/privacy" className="text-emerald-800 underline">プライバシーポリシー</Link>をご確認ください。</p>
  </PublicPage>;
}
