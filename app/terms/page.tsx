import type { Metadata } from "next";
import Link from "next/link";
import { PublicPage, PolicySection } from "@/components/public/PublicPage";
import { OperatorContact } from "@/components/public/OperatorContact";

export const metadata: Metadata = {
  title: "利用規約 | Soundwalk",
  description: "ライブ予定管理サービスSoundwalkの利用条件、登録情報の取り扱い、禁止事項、お問い合わせ先をご案内します。",
  alternates: { canonical: "https://soundwalk.net/terms" },
};

export default function TermsPage() {
  return <PublicPage><article className="max-w-3xl space-y-9">
    <div className="space-y-3"><h1 className="text-3xl font-bold">利用規約</h1><p className="text-sm text-slate-500">制定・最終更新日：2026年9月8日</p></div>
    <p className="leading-8 text-slate-700">本規約は、Soundwalk（以下「本サービス」）の利用条件を定めます。本サービスをご利用になる前に、内容をご確認ください。</p>
    <PolicySection title="1. サービスの内容と利用">
      <p>本サービスは、ライブ・演奏予定、出演名義、会場、準備事項等の登録・管理・共有を支援するサービスです。利用者は、本規約に同意したうえで、利用可能な機能をご利用ください。</p>
      <p>本サービスへの予定の登録は、会場の予約、出演契約、チケットの購入または公演の開催を保証するものではありません。出演条件や開催情報は、関係者・主催者に直接ご確認ください。</p>
    </PolicySection>
    <PolicySection title="2. アカウントと外部サービスの連携">
      <p>利用者は、自身が利用権限を持つGoogleアカウント等を使用し、アカウントと端末を適切に管理してください。他人へのなりすましや、権限のないアカウントの使用を禁止します。</p>
      <p>Googleカレンダー連携は任意です。利用者が許可したアカウントのカレンダーを読み取り、ライブ登録を補助します。Googleやその他の外部サービスの利用には、それぞれの利用条件も適用されます。</p>
    </PolicySection>
    <PolicySection title="3. 登録情報と公開範囲">
      <p>利用者は、登録・アップロードする文章、画像、楽曲情報等について、必要な権利・許可を確保してください。第三者の個人情報や非公開情報を、本人の許可なく共有しないでください。</p>
      <p>登録情報に関する権利は利用者または正当な権利者に帰属します。利用者は、予定の保存・表示・共有・配信など、本サービスの提供に必要な範囲で運営者が登録情報を使用することを許諾します。</p>
      <p>出演名義のメンバーや公開設定に応じて情報が共有・公開されます。カレンダーから取り込む際も、保存前に内容と公開範囲を確認してください。公開情報は第三者が保存・転載している場合があり、本サービスからの削除だけではその情報を消去できない場合があります。</p>
    </PolicySection>
    <PolicySection title="4. 禁止事項">
      <ul>
        <li>法令、公序良俗または本規約に反する行為。</li>
        <li>著作権、プライバシーその他の第三者の権利を侵害する行為。</li>
        <li>嫌がらせ、脅迫、差別、詐欺、なりすまし、虚偽情報の意図的な登録。</li>
        <li>不正アクセス、認証・権限制御の回避、マルウェアの配布、過剰なアクセス等によるサービス妨害。</li>
        <li>取得した情報を本人の同意なく不適切に収集・公開・販売する行為。</li>
      </ul>
    </PolicySection>
    <PolicySection title="5. 利用の制限・サービスの変更">
      <p>本規約への違反、不正利用、セキュリティ上の問題が認められる場合、必要な範囲でコンテンツの非表示・削除、利用の制限等を行うことがあります。</p>
      <p>保守、障害、外部サービスの変更等により、機能の変更・中断・終了を行う場合があります。利用者への影響が大きい変更は、緊急の場合を除き、可能な限り事前にお知らせします。大切な記録は利用者ご自身でも保管してください。</p>
    </PolicySection>
    <PolicySection title="6. 情報の確認と責任">
      <p>本サービスは、登録情報やカレンダーからの抽出結果の正確性・完全性、継続的な利用可能性を保証するものではありません。同じ日に登録があることだけでは、同一のライブであるとは限りません。日時・会場・内容は利用者ご自身でご確認ください。</p>
      <p>運営者の責めに帰すべき事由により利用者に損害が生じた場合は、適用される法令に従って責任を負います。本規約は、消費者保護法令その他の強行法規により認められる利用者の権利を制限しません。</p>
    </PolicySection>
    <PolicySection title="7. 個人情報・利用終了">
      <p>情報の取得・利用・保存・共有・削除については、<Link href="/privacy">プライバシーポリシー</Link>に従います。利用者はいつでも本サービスの利用を終了し、Google側で連携を解除できます。保存済み情報やアカウントの削除が必要な場合は、画面で削除するか、下記窓口へご連絡ください。</p>
    </PolicySection>
    <PolicySection title="8. 規約の変更">
      <p>本規約は、法令に従い必要に応じて変更することがあります。変更内容と適用開始日は本サービスでお知らせします。利用者の権利・義務に重大な影響を与える変更については、必要な周知期間を設け、法令上必要な場合は同意を取得します。</p>
    </PolicySection>
    <PolicySection id="contact" title="9. 運営者・お問い合わせ"><OperatorContact /></PolicySection>
  </article></PublicPage>;
}
