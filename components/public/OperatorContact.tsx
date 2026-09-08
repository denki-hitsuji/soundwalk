import { operator } from "@/lib/public/operator";

export function OperatorContact() {
  return <>
    <p>運営者：{operator.name}</p>
    <p>お問い合わせ：<a href={`mailto:${operator.email}`}>{operator.email}</a></p>
    <p>個人情報の開示・訂正・削除、アカウントの削除、サービスに関するお問い合わせは、上記窓口へご連絡ください。ご本人であることを確認のうえ対応します。Googleのパスワードやアクセストークンを送らないでください。</p>
  </>;
}
