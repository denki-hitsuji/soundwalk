// app/bands/[slug]/page.tsx
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const revalidate = 300; // 5分

type Payload = {
  act_id: string;
  slug: string;
  payload: {
      act_name: string;
      headline: string | null;
      body: string | null;
      photo_url: string | null;
      profile_link_url: string | null;
      performances: Array<{
          performance_id: string;
          event_date: string;
          venue_name: string;
          event_title: string | null;
          status: string;
          open_time: string | null;
          start_time: string | null;
          charge: number | null;
      }>;
  };
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

    console.log("Loaded public page data:", data);
    const p = (data as unknown as Payload).payload;

    console.log("Loaded public payload data:", p);
    console.log("headline:", p.headline);
    console.log("performances:", p.performances);
    const upcoming_performances = p.performances;
    const next_performance = p.performances?.[0] || null;
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
                <h2 className="text-sm font-semibold text-gray-800">ライブ予定</h2>
                {p.performances.length > 0 && (
                    <div className="bg-white divide-y">
                        {p.performances.map((x) => (
                            <div key={x.performance_id} className="rounded border p-3 gap-3 mt-3 text-sm">
                                <div className="font-medium">
                                    {x.event_date}
                                    <span className="ml-2 font-normal text-gray-700">@ {x.venue_name || "（未設定）"}</span>
                                </div>
                                {x.event_title && <div className="text-gray-700 mt-1">{x.event_title}</div>}
                                <div className="flex justify-between text-gray-500">
                                    open: {x.open_time || "未定"} / start: {x.start_time || "未定"} / charge: {x.charge || "未定"} 
                                </div>    
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <footer className="pt-4 text-center text-[11px] text-gray-400">Powered by Soundwalk</footer>
        </main>
    );
}
