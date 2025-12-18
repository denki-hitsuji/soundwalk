import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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
    </div>
  );
}