"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth/session.client";
import { Spinner } from "@/components/ui/Spinner";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    setBusy(true);
    try {
      await signOut();
    } catch (error) {
      console.error("signOut error", error);
      alert("ログアウトに失敗しました。");
      return;
    }
    finally {
      setBusy(false);
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
      className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-medium bg-white hover:bg-gray-50 disabled:opacity-50"
    >
      {busy && <Spinner size="sm" />}
      <span>{busy ? "ログアウト中…" : "ログアウト"}</span>
    </button>
  );
}
