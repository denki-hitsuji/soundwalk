// app/musician/acts/[actId]/page.tsx
import ActDetailClient from "./ActDetailClient";

export default async function Page({ params }: { params: Promise<{ actId: string }> }) {
  const { actId } = await params;
  return <ActDetailClient actId={actId} />;
}
