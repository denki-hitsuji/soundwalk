"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrentAct } from "@/lib/hooks/useCurrentAct";
import { ACTS_UPDATED_EVENT } from "@/lib/db/actEvents";
import { getMyActs } from "@/lib/api/acts";
import { useCurrentUser } from "@/lib/auth/session.client";
import { ActRow } from "@/lib/utils/acts";

export function ActSwitcher() {
  const { currentAct, setCurrentAct } = useCurrentAct();
  const [acts, setActs] = useState<ActRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const user = await useCurrentUser();
    if (!user.user) {
      setActs([]);
      setLoading(false);
      return;
    }
    console.log("ActSwitcher: load current user", user);
    const list = await getMyActs();
    console.log("ActSwitcher: loaded acts", list);
    setActs(list);

    // もし currentAct が存在するのに、一覧の名前が更新されていたら追随させる（重要）
    if (currentAct) {
      const fresh = list.find((a) => a.id === currentAct.id);
      if (fresh && fresh.name !== currentAct.name) {
        setCurrentAct(fresh);
      }
    }

    setLoading(false);
  }, [currentAct, setCurrentAct]);

  // 初回ロード
  useEffect(() => {
    void load();
  }, [load]);

  // acts 更新通知を購読して再ロード
  useEffect(() => {
    const onUpdate = () => {
      void load();
    };
    window.addEventListener(ACTS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(ACTS_UPDATED_EVENT, onUpdate);
  }, [load]);

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
        className="h-8 w-40 rounded-md border bg-white px-2 text-sm"
        value={currentId}
        onChange={(e) => {
          const id = e.target.value;
          const found = acts.find((a) => a.id === id);
          if (found) setCurrentAct(found);
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
