// SongSummaryCard.tsx
import Link from "next/link";
import { ACTS_UPDATED_EVENT } from "@/lib/db/actEvents";
import { createSupabaseServerClient } from "@/lib/supabase/server"; // ←あなたの実装に合わせてパス調整
import { getMyActs, getMyMemberActs } from "@/lib/api/acts";
import { SongRow, updateSongDb } from "@/lib/db/songs";

// ✅ Client部品（イベント受信して refresh するだけ）
import { ActsUpdateRefresher, AddSongForm } from "./SongSummaryClientBits";

type ActRow = {
  id: string;
  name: string;
  act_type: string | null;
  owner_profile_id: string;
};

type MemberRow = {
  act_id: string;
  is_admin: boolean;
  status: string | null;
};

function typeLabel(actType: string | null) {
  if (!actType) return "種別未設定";
  if (actType === "solo") return "ソロ";
  if (actType === "band") return "バンド";
  if (actType === "duo") return "デュオ";
  return actType;
}



async function getSongsByActIds(actIds: string[]): Promise<SongRow[]> {
  if (actIds.length === 0) return [];

  const supabase = await createSupabaseServerClient();

  // ✅ N+1 を避けてまとめて取る（テーブル名はあなたの実体に合わせて調整）
  // もし songs がビュー/別名ならここを変える
  const { data, error } = await supabase
    .from("act_songs")
    .select("*")
    .in("act_id", actIds)
    .order("title", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SongRow[];
}

function ActSongsCard({
  act,
  songs,
  canEdit,
}: {
  act: ActRow;
  songs: SongRow[];
  canEdit: boolean;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 space-y-3">
      {/* 名義ラベル + リンク */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{act.name}</div>
          <div className="text-[11px] text-gray-500">
            {typeLabel(act.act_type)} / {songs.length}曲
          </div>
        </div>

        <Link
          href="/musician/acts"
          className="shrink-0 text-[11px] text-blue-700 hover:underline"
          title="名義の管理へ"
        >
          名義を開く
        </Link>
      </div>

      {/* 曲一覧 */}
      {songs.length === 0 ? (
        <div className="text-sm text-gray-600">まだ曲が登録されていません。</div>
      ) : (
        <ul className="space-y-1 text-sm">
          {songs.map((s) => (
            <li key={s.id} className="flex items-start gap-2">
              <Link href="/musician/songs" className="min-w-0">
                <span className="text-gray-400">♪</span>{" "}
                <span className="truncate">{s.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 追加（カード下） */}
      <div className="pt-2 border-t">
        {canEdit ? (
          <AddSongForm actId={act.id} />
        ) : (
          <div className="text-[11px] text-gray-500">
            この名義は閲覧のみです（編集権限がありません）
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * ✅ Server Component: 初期表示は全てサーバーで確定させる
 */
export async function SongSummaryCard() {
  const supabase = await createSupabaseServerClient();

  // ✅ ログイン判定：ここはあなたの supabase helper に合わせて調整
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    // auth取得が壊れてたら、まずここで落とす（原因が見える）
    throw userError;
  }

  const userId = userData?.user?.id ?? null;

  if (!userId) {
    return (
      <main className="py-4 space-y-2">
        {/* ✅ acts更新イベントで refresh できるように ClientBits は置いておく */}
        <ActsUpdateRefresher eventName={ACTS_UPDATED_EVENT} />

        <h1 className="text-xl font-bold">演奏できる曲</h1>
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          ログインすると、名義ごとの曲リストを管理できます。
        </div>
      </main>
    );
  }

  // 参加名義（権限判定用）
  const mem = (await getMyMemberActs()) as unknown as MemberRow[] | null;
  const memberActIdSet = new Set((mem ?? []).map((m) => m.act_id));

  // 名義一覧（RLSで owner+member が見える前提）
  const actsData = (await getMyActs()) as unknown as ActRow[] | null;
  const acts = actsData ?? [];

  const actIds = acts.map((a) => a.id);
  const songs = await getSongsByActIds(actIds);

  // songsByActId をプレーンに組む（RSC境界安全）
  const songsByActId: Record<string, SongRow[]> = {};
  for (const s of songs) {
    (songsByActId[s.act_id] ??= []).push(s);
  }

  const canEdit = (act: ActRow) => {
    if (act.owner_profile_id === userId) return true;
    if (memberActIdSet.has(act.id)) return true; // ←メンバーも編集可、の方針
    return false;
  };

  return (
    <main className="py-4 space-y-4">
      <ActsUpdateRefresher eventName={ACTS_UPDATED_EVENT} />

      <header className="space-y-1">
        <h1 className="text-xl font-bold">演奏できる曲</h1>
        <p className="text-xs text-gray-600">
          名義ごとに「演奏できる曲」をまとめて見られます。曲追加も名義カードの下から行えます。
        </p>
      </header>

      {acts.length === 0 ? (
        <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">
          まずは名義（アクト）を作成してください。
          <Link href="/musician/acts" className="ml-2 text-blue-700 hover:underline">
            名義を作る
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {acts.map((act) => (
            <ActSongsCard
              key={act.id}
              act={act}
              songs={songsByActId[act.id] ?? []}
              canEdit={canEdit(act)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default SongSummaryCard;
