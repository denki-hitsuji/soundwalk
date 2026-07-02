// lib/utils/history.ts
// 実績（足跡）ページ用の型と純粋関数。
// トーンの原則：数字を誇らない。「巡った / 帰った / 立った」の移動・循環の語彙で語りかける。

export type HistoryAttachment = {
  file_url: string;
  file_type: string | null; // "flyer" 等
  caption: string | null;
  created_at: string;
};

export type HistoryPerformance = {
  id: string;
  event_date: string; // "YYYY-MM-DD"
  status: string | null;
  act_id: string | null;
  act_name: string | null;
  act_type: string | null;
  act_photo_url: string | null;
  venue_id: string | null;
  venue_name: string | null; // musician_performances.venue_name（自由入力）を優先表示に使う
  prefecture: string | null; // venues 由来（venue_id がある場合のみ）
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  attachments: HistoryAttachment[];
};

export type Season = "spring" | "summer" | "autumn" | "winter";
export type Granularity = "season" | "year";

export type Memory = {
  key: string; // "2023-summer" / "2023"
  label: string; // "2023年 夏" / "2023年"
  leadPhrase: string; // "この夏" / "この年" 等、語りかけの主語
  granularity: Granularity;
  periodStart: string; // メンバー最古の event_date
  periodEnd: string; // メンバー最新の event_date
  performances: HistoryPerformance[];
  count: number;
  venueCount: number; // 期間内に巡った場所数（distinct）
  topVenueName: string | null; // 期間内の最頻 venue_name
  topActName: string | null; // 期間内の最頻 act_name
  coverAttachment: HistoryAttachment | null;
  thumbnails: HistoryAttachment[]; // 最大4件
  // v2: setlist 由来の「よく鳴らした曲」（topSongs 等）をここに足す receptacle
};

export type ActJourney = {
  actId: string | null;
  actName: string;
  actType: string | null;
  photoUrl: string | null;
  count: number;
  firstDate: string;
  lastDate: string;
  coverAttachment: HistoryAttachment | null;
};

export type VenueTally = {
  venueId: string | null;
  name: string;
  count: number;
};

export type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  count: number;
};

export type HistorySummary = {
  totalCount: number;
  firstDate: string | null;
  lastDate: string | null;
  activeYears: number; // first から今日までの満年数（表示は「約N年」）
  venueCount: number; // distinct（venue_id があればそれ、無ければ venue_name で）
  prefectureCount: number;
  actJourneys: ActJourney[]; // count 降順
  venueRanking: VenueTally[]; // count 降順（上位のみ表示）
  mapPoints: MapPoint[]; // lat/lng を持つ会場のみ
};

export type Narration = { title: string; lines: string[] };

// ---------------------------------------------------------------------------
// 数え方ルール（canceled / cancelled の綴りゆれ対応）
// ---------------------------------------------------------------------------

const CANCELED_STATUSES = new Set(["canceled", "cancelled"]);

export function isCanceledStatus(status: string | null | undefined): boolean {
  return !!status && CANCELED_STATUSES.has(status.toLowerCase());
}

// ---------------------------------------------------------------------------
// DB行の正規化（join の単体/配列ゆれを吸収）
// ---------------------------------------------------------------------------

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizeHistoryRows(raw: unknown): HistoryPerformance[] {
  if (!Array.isArray(raw)) return [];
  const rows: HistoryPerformance[] = [];
  for (const r of raw as any[]) {
    if (!r?.id || !r?.event_date) continue;
    if (isCanceledStatus(r.status)) continue;

    const act = one<any>(r.acts);
    const venue = one<any>(r.venues);
    const attachments: HistoryAttachment[] = (Array.isArray(r.attachments) ? r.attachments : [])
      .filter((a: any) => typeof a?.file_url === "string" && a.file_url.length > 0)
      .map((a: any) => ({
        file_url: String(a.file_url),
        file_type: a.file_type ?? null,
        caption: a.caption ?? null,
        created_at: String(a.created_at ?? ""),
      }))
      .sort((a: HistoryAttachment, b: HistoryAttachment) => b.created_at.localeCompare(a.created_at));

    rows.push({
      id: String(r.id),
      event_date: String(r.event_date),
      status: r.status ?? null,
      act_id: r.act_id ?? null,
      act_name: act?.name ?? null,
      act_type: act?.act_type ?? null,
      act_photo_url: act?.photo_url ?? act?.icon_url ?? null,
      venue_id: r.venue_id ?? null,
      venue_name: r.venue_name ?? venue?.name ?? null,
      prefecture: venue?.prefecture ?? null,
      city: venue?.city ?? null,
      latitude: toNumberOrNull(venue?.latitude),
      longitude: toNumberOrNull(venue?.longitude),
      attachments,
    });
  }
  rows.sort((a, b) => a.event_date.localeCompare(b.event_date));
  return rows;
}

// ---------------------------------------------------------------------------
// 季節と粒度
// ---------------------------------------------------------------------------

export const SEASON_JA: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

// 12月は「翌年の冬」に寄せる（12/1/2 をひとつの冬にまとめる）
export function seasonOf(ymd: string): { year: number; season: Season } {
  const [y, m] = ymd.split("-").map(Number);
  if (m >= 3 && m <= 5) return { year: y, season: "spring" };
  if (m >= 6 && m <= 8) return { year: y, season: "summer" };
  if (m >= 9 && m <= 11) return { year: y, season: "autumn" };
  return { year: m === 12 ? y + 1 : y, season: "winter" };
}

export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

// 活動歴が浅いうち（〜この月数）は季節で細かく味わい、長くなったら年で俯瞰する
export const SEASON_SPAN_THRESHOLD_MONTHS = 24;

// データ量で自動切替：短い/少ない→季節、長い→年
// 入力は event_date 昇順前提
export function decideGranularity(perfs: HistoryPerformance[]): Granularity {
  if (perfs.length === 0) return "year";
  const dates = perfs.map((p) => p.event_date);
  const span = monthsBetween(dates[0], dates[dates.length - 1]);
  return span <= SEASON_SPAN_THRESHOLD_MONTHS ? "season" : "year";
}

// ---------------------------------------------------------------------------
// メモリー生成
// ---------------------------------------------------------------------------

// 最頻値。同数なら直近（あとに出てきたもの）優先
function mostFrequent(values: (string | null)[]): string | null {
  const count = new Map<string, number>();
  const lastIndex = new Map<string, number>();
  values.forEach((v, i) => {
    if (!v) return;
    count.set(v, (count.get(v) ?? 0) + 1);
    lastIndex.set(v, i);
  });
  let best: string | null = null;
  for (const [v, c] of count) {
    if (best === null) {
      best = v;
      continue;
    }
    const bc = count.get(best)!;
    if (c > bc || (c === bc && lastIndex.get(v)! > lastIndex.get(best)!)) best = v;
  }
  return best;
}

function distinctVenueKeyCount(perfs: HistoryPerformance[]): number {
  const keys = new Set<string>();
  for (const p of perfs) {
    const key = p.venue_id ?? p.venue_name;
    if (key) keys.add(key);
  }
  return keys.size;
}

// 期間内の attachments を新しい順に集める（flyer 優先の cover 選定にも使う）
function collectAttachments(perfs: HistoryPerformance[]): HistoryAttachment[] {
  const all = perfs.flatMap((p) => p.attachments);
  return [...all].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function pickCover(attachments: HistoryAttachment[]): HistoryAttachment | null {
  const flyer = attachments.find((a) => a.file_type === "flyer");
  return flyer ?? attachments[0] ?? null;
}

export function groupIntoMemories(perfs: HistoryPerformance[]): Memory[] {
  if (perfs.length === 0) return [];
  const granularity = decideGranularity(perfs);

  const buckets = new Map<string, { label: string; leadPhrase: string; perfs: HistoryPerformance[] }>();
  for (const p of perfs) {
    let key: string;
    let label: string;
    let leadPhrase: string;
    if (granularity === "season") {
      const { year, season } = seasonOf(p.event_date);
      key = `${year}-${season}`;
      label = `${year}年 ${SEASON_JA[season]}`;
      leadPhrase = `この${SEASON_JA[season]}`;
    } else {
      const year = p.event_date.slice(0, 4);
      key = year;
      label = `${year}年`;
      leadPhrase = "この年";
    }
    const bucket = buckets.get(key) ?? { label, leadPhrase, perfs: [] };
    bucket.perfs.push(p);
    buckets.set(key, bucket);
  }

  const memories: Memory[] = [];
  for (const [key, { label, leadPhrase, perfs: members }] of buckets) {
    const attachments = collectAttachments(members);
    memories.push({
      key,
      label,
      leadPhrase,
      granularity,
      periodStart: members[0].event_date,
      periodEnd: members[members.length - 1].event_date,
      performances: members,
      count: members.length,
      venueCount: distinctVenueKeyCount(members),
      topVenueName: mostFrequent(members.map((p) => p.venue_name)),
      topActName: mostFrequent(members.map((p) => p.act_name)),
      coverAttachment: pickCover(attachments),
      thumbnails: attachments.slice(0, 4),
    });
  }

  // 新しい期間が上
  memories.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  return memories;
}

// ---------------------------------------------------------------------------
// 語りかけ生成（決定論テンプレート方式。実行時 LLM 呼び出しはしない）
// 語彙の統一：「積み上げた/達成/記録更新」等は使わない。「巡る・帰る・立つ・灯す・移動」を基調に。
// ---------------------------------------------------------------------------

export function buildMemoryNarration(m: Memory): Narration {
  const lines: string[] = [];
  const quiet = m.count <= 2;
  if (quiet) {
    lines.push(`${m.label}は、少し立ち止まった季節。`);
    lines.push(`それも、移動のうち。`);
    if (m.topVenueName) lines.push(`${m.topVenueName}に、また灯りをともした。`);
  } else {
    lines.push(`${m.leadPhrase}、あなたは${m.count}回ステージに立った。`);
    if (m.topVenueName) lines.push(`よく帰ったのは、${m.topVenueName}。`);
    if (m.topActName) lines.push(`${m.topActName}と、いちばん長く過ごした季節。`);
  }
  return { title: m.label, lines };
}

export function buildOpeningNarration(s: HistorySummary): Narration {
  const lines: string[] = [];
  if (!s.firstDate || s.totalCount === 0) {
    return {
      title: "はじまりは、これから",
      lines: ["まだ足跡はここから。", "最初の一歩を、いつか振り返れるように。"],
    };
  }
  const { year, season } = seasonOf(s.firstDate);
  lines.push(`あなたはこれまで、${s.totalCount}回ステージに立ってきた。`);
  lines.push(`最初の一歩は、${year}年の${SEASON_JA[season]}。`);
  lines.push(`${s.venueCount}の場所を巡って、今日まで。`);
  return { title: "あなたの足跡", lines };
}

// ---------------------------------------------------------------------------
// サマリ・地図・会場・名義
// ---------------------------------------------------------------------------

// first から today までの満年数（端数切り捨て）
export function fullYearsBetween(firstYmd: string, todayYmd: string): number {
  const [fy, fm, fd] = firstYmd.split("-").map(Number);
  const [ty, tm, td] = todayYmd.split("-").map(Number);
  let years = ty - fy;
  if (tm < fm || (tm === fm && td < fd)) years -= 1;
  return Math.max(0, years);
}

export function buildHistorySummary(perfs: HistoryPerformance[], todayYmd?: string): HistorySummary {
  const today = todayYmd ?? new Date().toLocaleDateString("sv-SE");
  const firstDate = perfs[0]?.event_date ?? null;
  const lastDate = perfs[perfs.length - 1]?.event_date ?? null;

  // 名義それぞれの歩み
  const journeyMap = new Map<string, ActJourney & { attachments: HistoryAttachment[] }>();
  for (const p of perfs) {
    const name = p.act_name;
    const key = p.act_id ?? (name ? `name:${name}` : null);
    if (!key || !name) continue;
    const entry = journeyMap.get(key) ?? {
      actId: p.act_id,
      actName: name,
      actType: p.act_type,
      photoUrl: p.act_photo_url,
      count: 0,
      firstDate: p.event_date,
      lastDate: p.event_date,
      coverAttachment: null,
      attachments: [] as HistoryAttachment[],
    };
    entry.count += 1;
    if (p.event_date < entry.firstDate) entry.firstDate = p.event_date;
    if (p.event_date > entry.lastDate) entry.lastDate = p.event_date;
    entry.attachments.push(...p.attachments);
    journeyMap.set(key, entry);
  }
  const actJourneys: ActJourney[] = [...journeyMap.values()]
    .map(({ attachments, ...j }) => ({
      ...j,
      coverAttachment: pickCover([...attachments].sort((a, b) => b.created_at.localeCompare(a.created_at))),
    }))
    .sort((a, b) => b.count - a.count);

  // 会場ランキング（venue_name 単位）
  const venueMap = new Map<string, VenueTally>();
  for (const p of perfs) {
    if (!p.venue_name) continue;
    const entry = venueMap.get(p.venue_name) ?? { venueId: p.venue_id, name: p.venue_name, count: 0 };
    entry.count += 1;
    if (!entry.venueId && p.venue_id) entry.venueId = p.venue_id;
    venueMap.set(p.venue_name, entry);
  }
  const venueRanking = [...venueMap.values()].sort((a, b) => b.count - a.count);

  // 地図（座標を持つ会場のみ、name で集約）
  const pointMap = new Map<string, MapPoint>();
  for (const p of perfs) {
    if (p.latitude == null || p.longitude == null) continue;
    const name = p.venue_name ?? "どこかの場所";
    const entry = pointMap.get(name) ?? { name, lat: p.latitude, lng: p.longitude, count: 0 };
    entry.count += 1;
    pointMap.set(name, entry);
  }

  const prefectures = new Set(perfs.map((p) => p.prefecture).filter((v): v is string => !!v));

  return {
    totalCount: perfs.length,
    firstDate,
    lastDate,
    activeYears: firstDate ? fullYearsBetween(firstDate, today) : 0,
    venueCount: distinctVenueKeyCount(perfs),
    prefectureCount: prefectures.size,
    actJourneys,
    venueRanking,
    mapPoints: [...pointMap.values()],
  };
}
