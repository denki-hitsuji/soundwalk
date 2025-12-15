"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    setBusy(false);

    if (error) {
      console.error("signOut error", error);
      alert("ログアウトに失敗しました。");
      return;
    }

    // セッションが消えた状態でログインへ
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={busy}
      className="inline-flex items-center rounded border px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 disabled:opacity-50"
    >
      {busy ? "ログアウト中…" : "ログアウト"}
    </button>
  );
}
