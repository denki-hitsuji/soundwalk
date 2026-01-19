"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { notifyActsUpdated } from "@/lib/db/actEvents";
import { getActById } from "@/lib/api/acts";
import { insertAct } from "@/lib/api/actsAction";

// ✅ 共通部品
import { RequiredLabel } from "@/components/forms/RequiredLabel";
import { hasMissingRequired } from "@/lib/forms/required";

type Props = {
  userId: string;
};

/** -------------------------
 * 必須項目定義（ここが唯一の真実）
 * ------------------------ */
const fields = {
  name: { label: "名義名", required: true },
  actType: { label: "種別", required: false },
} as const;

type FieldKey = keyof typeof fields;

export default function ActNewClient({ userId }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [actType, setActType] = useState<"solo" | "band" | "duo">("solo");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 必須不足判定（表示とボタン制御を同じ情報源で）
  const formValues = useMemo(
    () => ({
      name,
      actType,
    }),
    [name, actType]
  );

  const requiredKeys = useMemo(
    () => (Object.keys(fields) as FieldKey[]).filter((k) => fields[k].required),
    []
  );

  const missingRequired = hasMissingRequired(formValues, requiredKeys);

  const canCreate = !saving && !missingRequired;

  const create = async () => {
    setErr(null);

    // 最終防衛（UIでdisableしていても server を信用しない）
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("名義名を入力してください");
      return;
    }

    setSaving(true);
    try {
      const { id } = await insertAct({
        name: trimmed,
        act_type: actType,
        description: "",
        is_temporary: false,
        photo_url: null,
        profile_link_url: null,
        icon_url: null,
      });

      // 念のため取得して既定名義チェック（元コード踏襲）
      const act = await getActById(id);

      notifyActsUpdated();

      if (act && trimmed === act.name) {
        router.push(`/musician/acts/${act.id}`);
        return;
      }

      router.push(`/musician/acts`);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "作成に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">名義を追加</h1>
        <p className="text-xs text-gray-600 mt-1">
          あとからプロフィールや写真も編集できます。
        </p>
      </header>

      <div className="rounded border bg-white p-4 space-y-3 max-w-md">
        {/* 名義名（必須） */}
        <label className="block text-sm">
          <RequiredLabel label={fields.name.label} required={fields.name.required} />
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例：ザ・ホリデイズ"
          />
        </label>

        {/* 種別 */}
        <label className="block text-sm">
          <RequiredLabel label={fields.actType.label} required={fields.actType.required} />
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={actType}
            onChange={(e) => setActType(e.target.value as any)}
          >
            <option value="solo">ソロ</option>
            <option value="band">バンド</option>
            <option value="duo">デュオ</option>
          </select>
        </label>

        {missingRequired && (
          <div className="text-xs text-red-600">※ 名義名は必須です</div>
        )}

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button
          type="button"
          onClick={() => void create()}
          disabled={!canCreate}
          className="inline-flex items-center justify-center rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "作成中…" : "作成"}
        </button>
      </div>
    </main>
  );
}
