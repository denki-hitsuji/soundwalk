"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentAct } from "@/lib/useCurrentAct"; // ←あなたの実体に合わせて

type ActRow = { id: string; name: string; act_type: string | null };

export function ActSwitcher() {
  const { currentAct, setCurrentAct } = useCurrentAct(); // ←ここがポイント
  const [acts, setActs] = useState<ActRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id ?? null;

      if (!uid) {
        setActs([]);
        setLoading(false);
        return;
      }

      // RLSで「owner or member」が見える前提（すでに整備済みの想定）
      const { data, error } = await supabase
        .from("acts")
        .select("id, name, act_type")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("load acts error", error);
        setActs([]);
      } else {
        setActs((data ?? []) as ActRow[]);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const currentId = currentAct?.id ?? "";

  if (loading) {
    return <div className="text-[11px] text-gray-500">名義…</div>;
  }

  if (acts.length === 0) {
    return <div className="text-[11px] text-gray-500">名義なし</div>;
  }

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-[11px] text-gray-500">名義</span>

      <select
        className="h-8 rounded-md border bg-white px-2 text-sm"
        value={currentId}
        onChange={(e) => {
          const id = e.target.value;
          const found = acts.find((a) => a.id === id) ?? null;
          setCurrentAct(found); // ← IDではなくオブジェクトをセット
        }}
        title="操作対象の名義を切り替え"
      >
        <option value="">（未選択）</option>
        {acts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      {/* <span className="text-[11px] text-gray-500 truncate max-w-[140px]">
        {currentAct ? `現在：${currentAct.name}` : "未選択"}
      </span> */}
    </label>
  );
}
