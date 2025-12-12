// scripts/seedVenues.ts
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

type VenueCsvRow = {
  name: string;
  short_name?: string;
  address?: string;
  city?: string;
  prefecture?: string;
  capacity?: string;
  url?: string;
  notes?: string;
};

function parseCsv(text: string): VenueCsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(",");

  return dataLines.map((line) => {
    const cols = line.split(",");
    const row: any = {};
    headers.forEach((h, i) => {
      row[h.trim()] = (cols[i] ?? "").trim();
    });
    return row as VenueCsvRow;
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const csvPath = path.join(process.cwd(), "data", "venues.csv");
  const csvText = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csvText);

  // 必要なら一旦全部消す（本番でやるかは判断次第）
  // await supabase.from("venues").delete().neq("id", "");

  const payload = rows.map((r) => ({
    name: r.name,
    short_name: r.short_name || null,
    address: r.address || null,
    city: r.city || null,
    prefecture: r.prefecture || null,
    capacity:
      r.capacity && r.capacity.trim() !== ""
        ? Number(r.capacity)
        : null,
    url: r.url || null,
    notes: r.notes || null,
  }));

  const { error } = await supabase.from("venues").insert(payload);
  if (error) {
    console.error("Insert venues error:", error);
    process.exit(1);
  }

  console.log(`Inserted ${payload.length} venues`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
