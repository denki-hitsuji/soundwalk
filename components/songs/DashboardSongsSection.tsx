import { getDashboardSongs } from "@/lib/db/dashboardSongs";
import Link from "next/link";

export async function DashboardSongsSection() {
  const songs = await getDashboardSongs();

  if (songs.length === 0) {
    return <div className="text-sm text-gray-500">登録された曲はまだありません。</div>;
  }

  return (
    <section className="space-y-2 truncate">
      <h2 className="text-sm font-semibold text-gray-700">曲目</h2>

      <ul className="divide-y rounded border bg-white">
        {songs.map((song) => (
          <li key={song.id} className="px-3 py-2 truncate text-sm font-medium  ">
            <Link href={`/musician/songs/${song.id}`} className="hover:underline">
              {song.title}
            </Link>
            {song.acts?.[0]?.name && (
              <span className="ml-2 text-xs text-gray-500">
                ({song.acts?.[0]?.name})
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="text-right">
        <Link
          href="/musician/songs"
          className="text-xs text-blue-600 hover:underline"
        >
          曲一覧へ →
        </Link>
      </div>
    </section>
  );
}
