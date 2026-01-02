import Link from "next/link";
import { supabase } from "@/lib/supabase/client.legacy";;

export default function CheckEmailPage() {

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold leading-tight">
          メールが送信されました
        </h1>
        <p className="mt-2 text-sm text-gray-600">
                  メールボックスをご確認の上、「メールを確認する」リンクからお進み下さい。
                  </p>
      </div>
     <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold leading-tight">
          注意事項
        </h2>
        <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
          <li>メールが届くまでに数分かかる場合があります。</li>
          <li>10分経ってもメールが届かない場合は、迷惑メールフォルダもご確認ください。</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600 font-semibold">
          このページは閉じて構いません。
        </p>
     </div>
    </div>
  );
}