import { Suspense } from "react";
import InviteClient from "./InviteClient";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold">招待を確認中…</h1>
          <p className="text-sm text-gray-600 mt-2">読み込み中…</p>
        </div>
      }
    >
      <InviteClient token={token} />
    </Suspense>
  );
}
