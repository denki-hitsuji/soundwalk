// app/(public)/auth/confirm/page.tsx
import { Suspense } from "react";
import AuthConfirmClient from "./AuthConfirmClient";

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-2">
          <h1 className="text-lg font-bold">メール確認</h1>
          <p className="text-sm text-gray-700">確認中…</p>
        </div>
      }
    >
      <AuthConfirmClient />
    </Suspense>
  );
}
