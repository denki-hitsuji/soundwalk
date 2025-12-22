// lib/dateUtils.ts
export function toYmdLocal(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmdLocal(yyyyMMdd: string): Date {
  const [y, m, d] = yyyyMMdd.split("-").map((n) => Number(n));
  // ローカルタイムの 00:00 を明示的に作る
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

export function addDaysLocal(date: Date, deltaDays: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

export function diffDaysLocal(target: Date, base: Date): number {
  // 日付差を「日」単位で安定させる（時刻の影響を弱める）
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const b = new Date(base.getFullYear(), base.getMonth(), base.getDate()).getTime();
  return Math.floor((t - b) / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, deltaDays: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

export function diffDays(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export function fmtMMdd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}/${day}`;
}

