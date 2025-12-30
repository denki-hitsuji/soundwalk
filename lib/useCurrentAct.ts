"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, supabase } from "@/lib/supabaseClient";
import { ActRow } from "./actQueries";

type CurrentActContextValue = {
  currentAct: ActRow | null;
  currentActId: string | null;
  setCurrentAct: React.Dispatch<React.SetStateAction<ActRow | null>>;
  loading: boolean;
};
const STORAGE_KEY = "soundwalk.currentActId";

function normalizeAct(value: unknown): ActRow | null {
  if (!value) return null;

  // join が配列で返るケース
  if (Array.isArray(value)) {
    const v = value[0];
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.id === "string" && typeof o.name === "string" && typeof o.owner_profile_id === "string" ) {
        return {
          id: o.id, owner_profile_id: o.owner_profile_id, name: o.name,
          act_type: (o.act_type as string | null) ?? null,
          is_temporary: (o.is_temporary as boolean | null) ?? false,
          description: (o.description as string | null) ?? null,
          icon_url: (o.icon_url as string | null) ?? null,
          photo_url: (o.photo_url as string | null) ?? null,
          profile_link_url: (o.profile_link_url as string | null) ?? null
        };
      }
    }
    return null;
  }

  // join が単体で返るケース
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.id === "string" && typeof o.name === "string" && typeof o.owner_profile_id === "string" ) {
      return {
        id: o.id, name: o.name, owner_profile_id: o.owner_profile_id,
        act_type: (o.act_type as string | null) ?? null,
        is_temporary: (o.is_temporary as boolean | null) ?? false,
        description: (o.description as string | null) ?? null,
        icon_url: (o.icon_url as string | null) ?? null,
        photo_url: (o.photo_url as string | null) ?? null,
        profile_link_url: (o.profile_link_url as string | null) ?? null
      };
    }
  }

  return null;
}

export function useCurrentAct(): CurrentActContextValue {
  const [currentAct, setCurrentAct] = useState<ActRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCurrentAct(null);
        setLoading(false);
        return;
      }

      const storedActId = localStorage.getItem(STORAGE_KEY);

      // ① localStorage 優先
      if (storedActId) {
        const { data, error } = await supabase
          .from("acts")
          .select("id, name, act_type, owner_profile_id, is_temporary, description, icon_url, photo_url, profile_link_url")
          .eq("id", storedActId)
          .single();

        if (!error && data?.id) {
          setCurrentAct({
            id: data.id,
            name: data.name,
            act_type: data.act_type ?? null,
            owner_profile_id: data.owner_profile_id,
            is_temporary: (data.is_temporary as boolean | null) ?? false,
            description: (data.description as string | null) ?? null,
            icon_url: (data.icon_url as string | null) ?? null,
            photo_url: (data.photo_url as string | null) ?? null,
            profile_link_url: (data.profile_link_url as string | null) ?? null
          });
          setLoading(false);
          return;
        }
      }

      // ② act_members -> acts join （配列/単体両対応）
      const { data: rows, error: memErr } = await supabase
        .from("act_members")
        .select(
          `
          act:acts (
            id,
            name,
            act_type
          )
        `
        )
        .eq("profile_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (memErr) {
        console.error("useCurrentAct / load act_members error", memErr);
        setCurrentAct(null);
        setLoading(false);
        return;
      }

      const raw = (rows?.[0] as any)?.act; // supabase型推論の揺れ対策
      const act = normalizeAct(raw);

      if (act?.id) {
        localStorage.setItem(STORAGE_KEY, act.id);
        setCurrentAct(act);
      } else {
        setCurrentAct(null);
      }

      setLoading(false);
    };

    void load();
  }, []);

  const setAct = (act: ActRow | null) => {
    if (act)
    {
      localStorage.setItem(STORAGE_KEY, act?.id);
      setCurrentAct(act);
    }
  };

  return {
    currentAct,
    currentActId: currentAct?.id ?? null,
    setCurrentAct,
    loading,
  };
}
