"use server";

import Link from "next/link";
import {  useMemo } from "react";
import {
  PREP_DEFS,
  type PerformanceWithActs,
  type FlyerMap,
  type DetailsRow,
  type DetailsMap,
  type PrepTaskRow,
  type PrepMap,
  getPerformances,
} from "@/lib/utils/performance";

import { toYmdLocal, parseYmdLocal, addDays } from "@/lib/utils/date";
import { getFutureFlyers } from "@/lib/utils/performance";
import { ensureAndFetchPrepMapDb, getDetailsMapForPerformances } from "@/lib/db/performances";
import { getCurrentUser } from "@/lib/auth/session.server";
import { redirect } from "next/navigation";
import { PerformancesClient } from "./PerformancesClient";

export default async function PerformancesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  console.log("PerformancesPage: user got");

  const rank = (s: string | null) => (s === "offered" ? 0 : s === "pending_reconfirm" ? 1 : 2);
  const todayStr = toYmdLocal();
  const todayDate = parseYmdLocal(todayStr);

  // 1) ライブ一覧（acts も一緒）
  const { data, error } = await getPerformances();
  const performances = (data ?? []) as unknown as PerformanceWithActs[];
  console.log("PerformancesPage: performs got");

  performances.sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return (b.event_date ?? "").localeCompare(a.event_date ?? "");
  });
  console.log("PerformancesPage: performs sorted");
  var flyerByPerformanceId: FlyerMap = {};
  var detailsByPerformanceId: DetailsMap = {};
  var prepByPerformanceId: PrepMap = {};

  const futureIds = performances.filter((p) => p.event_date >= todayStr).map((p) => p.id);
  console.log("PerformancesPage: furureIds got");

  // 2) 未来分の代表フライヤー（最新1枚）
  const { data: atts, error: attErr } = await getFutureFlyers(futureIds);
  console.log("PerformancesPage: flyers got");

  if (attErr) {
    console.error("load future flyers error", attErr);
  } else {
    const map: FlyerMap = {};
    for (const a of atts ?? []) {
      if (!map[a.performance_id]) map[a.performance_id] = { file_url: a.file_url, created_at: a.created_at };
    }
    flyerByPerformanceId = map;
  }

  // 3) 未来分の details
  const { data: dets, error: detErr } = await getDetailsMapForPerformances(futureIds);
  console.log("PerformancesPage: details got");

  if (detErr) {
    console.error("load future details error", detErr);
  } else {
    const dmap: DetailsMap = {};
    for (const d of (dets ?? []) as unknown as DetailsRow[]) dmap[d.performance_id] = d;
    detailsByPerformanceId = dmap;
  }

  // 4) 段取りタスク：未来分を upsert（方式B）
  //    まず desired rows を作る → upsert → select して state に入れる
  const desired = performances
    .filter((p) => p.event_date >= todayStr && p.act_id && p.status !== "cancelled")
    .flatMap((p) => {
      const eventDate = parseYmdLocal(p.event_date);
      return PREP_DEFS.map((def) => {
        const due = addDays(eventDate, def.offsetDays);
        const dueStr = due.toISOString().slice(0, 10);
        return {
          performance_id: p.id,
          task_key: def.key,
          act_id: p.act_id, // performance.act_id が入ってれば共有が自然に揃う
          due_date: dueStr,
        };
      });
    });
 console.log("PerformancesPage: preps got");

  const { data: prepMap, error: upErr } = await ensureAndFetchPrepMapDb({
    performances: performances.filter((p) => p.event_date >= todayStr && p.act_id && p.status !== "cancelled"),
  });

  if (upErr) {
    console.error("prep upsert error", upErr);
  } else {
    const pm: PrepMap = {};
    for (const t of Object.values(prepMap ?? {})) {
      const row = t as PrepTaskRow;
      pm[row.performance_id] ??= {};
      pm[row.performance_id][row.task_key] = row;
    }
    prepByPerformanceId = pm;
  }

  return (
    <main className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">ライブタイムライン</h1>
          <p className="text-xs text-gray-600 mt-1">
            未来のライブは「フライヤー + 確認事項 + 段取りチェック（共有）」を一覧で確認できます。
          </p>
        </div>

        <Link
          href="/musician/performances/new"
          className="shrink-0 inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
        >
          + 新規登録
        </Link>
      </header>

      <PerformancesClient userId={user?.id} performances={performances}
        flyerByPerformanceId={flyerByPerformanceId}
        detailsByPerformanceId={detailsByPerformanceId}
        prep={prepByPerformanceId} />
    </main>
  );
}
