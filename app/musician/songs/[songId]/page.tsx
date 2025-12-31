// app/musician/songs/[songId]/page.tsx
import SongDetailClient from "./SongDetailClient";

export default async function SongDetailPage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = await params;
  return <SongDetailClient songId={songId} />;
}
