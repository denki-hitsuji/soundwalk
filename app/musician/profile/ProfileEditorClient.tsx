// app/musician/profile/ProfileEditorClient.tsx
"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ProfileRow } from "@/lib/api/profiles";

type ActionState =
  | { ok: true; message: string; profile: ProfileRow }
  | { ok: false; message: string };

export default function ProfileEditorClient(props: {
  initialProfile: ProfileRow | null;
  saveProfile: (prev: ActionState | null, formData: FormData) => Promise<ActionState>;
}) {
  const { initialProfile, saveProfile } = props;

  const initialName = useMemo(() => initialProfile?.display_name ?? "", [initialProfile]);
  const [name, setName] = useState(initialName);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const [state, action, isPending] = useActionState<ActionState | null, FormData>(saveProfile, null);

  const currentMessage = state?.message ?? null;
  const isOk = state?.ok ?? null;

  return (
    <div className="rounded-xl border p-4 space-y-4">
      <form
        action={(fd) => {
          // controlled input の値を確実に送る
          fd.set("display_name", name);
          return action(fd);
        }}
        className="space-y-3"
      >
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="display_name">
            表示名（メンバー一覧に出る名前）
          </label>
          <input
            id="display_name"
            name="display_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例）さとレックス"
            className="w-full rounded-md border px-3 py-2 text-sm"
            maxLength={40}
            autoComplete="nickname"
          />
          <div className="text-xs text-muted-foreground">{name.trim().length}/40</div>
        </div>

        {currentMessage && (
          <div className={`text-sm ${isOk ? "text-green-700" : "text-red-700"}`}>
            {currentMessage}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isPending ? "保存中…" : "保存"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setName(initialName)}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            元に戻す
          </button>
        </div>
      </form>

      <div className="text-xs text-muted-foreground leading-relaxed">
        * バンドごとに表示名を変える仕様は、将来「act_members.display_name」等で拡張できます。
        <br />
        今回はまず “profiles の display_name を確実に編集できる” を完成させます。
      </div>
    </div>
  );
}
