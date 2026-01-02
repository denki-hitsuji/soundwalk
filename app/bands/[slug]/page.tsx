// app/bands/[slug]/page.tsx
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 300; // 5分

type Payload = {
  act_id: string;
  slug: string;
  act_name: string;
  headline: string | null;
  body: string | null;
  photo_url: string | null;
  profile_link_url: string | null;
  act_description: string | null;
  next_performance: null | {
    id: string;
    event_date: string;
    venue_name: string;
    event_title: string | null;
    status: string;
  };
  upcoming_performances: Array<{
    id: string;
    event_date: string;
    venue_name: string;
    event_title: string | null;
    status: string;
  }>;
};

export default async function BandPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data, error } = await supabase
    .from("v_act_public_page_payload")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("public page load error", error);
    notFound();
  }
  if (!data) notFound();

  const p = data as unknown as Payload;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{p.act_name}</h1>
        {p.headline && <p className="text-sm text-gray-600">{p.headline}</p>}
      </header>

      <section>
        <details className="rounded border bg-white p-3">
          <summary className="cursor-pointer text-sm font-medium">プロフィール</summary>
          <div className="mt-3 space-y-3">
            {p.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.photo_url} alt="photo" className="w-full rounded border object-cover" />
            )}

            {p.body ? (
              <div className="whitespace-pre-wrap text-sm text-gray-700">{p.body}</div>
            ) : p.act_description ? (
              <div className="whitespace-pre-wrap text-sm text-gray-700">{p.act_description}</div>
            ) : (
              <div className="text-sm text-gray-500">プロフィールはまだありません。</div>
            )}

            {p.profile_link_url && (
              <a className="text-sm text-blue-700 hover:underline" href={p.profile_link_url} target="_blank" rel="noreferrer">
                リンク
              </a>
            )}
          </div>
        </details>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">次のライブ</h2>

        {p.next_performance ? (
          <div className="rounded border bg-white p-3">
            <div className="text-sm font-semibold">
              {p.next_performance.event_date}
              <span className="ml-2 font-normal text-gray-700">@ {p.next_performance.venue_name || "（未設定）"}</span>
            </div>
            {p.next_performance.event_title && <div className="mt-1 text-sm text-gray-700">{p.next_performance.event_title}</div>}
          </div>
        ) : (
          <div className="rounded border bg-white p-3 text-sm text-gray-600">直近の予定はまだありません。</div>
        )}

        {p.upcoming_performances.length > 0 && (
          <div className="rounded border bg-white divide-y">
            {p.upcoming_performances.map((x) => (
              <div key={x.id} className="p-3 text-sm">
                <div className="font-medium">
                  {x.event_date}
                  <span className="ml-2 font-normal text-gray-700">@ {x.venue_name || "（未設定）"}</span>
                </div>
                {x.event_title && <div className="text-gray-700 mt-1">{x.event_title}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="pt-4 text-center text-[11px] text-gray-400">Powered by Soundwalk</footer>
    </main>
  );
}
