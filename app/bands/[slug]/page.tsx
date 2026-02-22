// app/bands/[slug]/page.tsx
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fmtDateWithDay, fmtTime, fmtCharge } from "@/lib/utils/format";

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

function PerformanceCard({ x }: { x: Payload["payload"]["performances"][number] }) {
    const date = fmtDateWithDay(x.event_date);
    const open = fmtTime(x.open_time);
    const start = fmtTime(x.start_time);
    const charge = fmtCharge(x.charge);

    return (
        <div className="rounded-xl border bg-white p-4 space-y-1.5 shadow-sm">
            <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-gray-900">{date}</span>
                <span className="text-sm text-gray-600">@ {x.venue_name || "（未設定）"}</span>
            </div>

            {x.event_title && (
                <div className="text-sm font-medium text-gray-800">{x.event_title}</div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {open && <span>OPEN {open}</span>}
                {start && <span>START {start}</span>}
                {charge && <span>CHARGE {charge}</span>}
                {!open && !start && !charge && <span>詳細未定</span>}
            </div>
        </div>
    );
}

export default async function BandPublicPage({ params }: { params: Promise<{ slug: string }> }) {
    const supabase = await createSupabaseServerClient();
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

    const p = (data as unknown as Payload).payload;

    // 未来・過去に分割
    const today = new Date().toISOString().slice(0, 10);
    const futurePerformances = p.performances
        .filter((x) => x.event_date >= today)
        .sort((a, b) => a.event_date.localeCompare(b.event_date));
    const pastPerformances = p.performances
        .filter((x) => x.event_date < today)
        .sort((a, b) => b.event_date.localeCompare(a.event_date));

    return (
        <main className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
            {/* プロフィール */}
            <header className="space-y-4">
                {p.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={p.photo_url}
                        alt={p.act_name}
                        className="w-full max-h-80 rounded-xl border object-cover"
                    />
                )}
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">{p.act_name}</h1>
                    {p.headline && <p className="text-sm text-gray-600">{p.headline}</p>}
                </div>

                {p.body && (
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {p.body}
                    </div>
                )}

                {p.profile_link_url && (
                    <a
                        className="inline-flex items-center text-sm text-blue-700 hover:underline"
                        href={p.profile_link_url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        プロフィールリンク &rarr;
                    </a>
                )}
            </header>

            {/* これからのライブ */}
            <section className="space-y-3">
                <h2 className="text-base font-bold text-gray-900">これからのライブ</h2>

                {futurePerformances.length === 0 ? (
                    <p className="text-sm text-gray-500">現在予定されているライブはありません。</p>
                ) : (
                    <div className="space-y-3">
                        {futurePerformances.map((x) => (
                            <PerformanceCard key={x.performance_id} x={x} />
                        ))}
                    </div>
                )}
            </section>

            {/* 過去のライブ */}
            {pastPerformances.length > 0 && (
                <section className="space-y-3">
                    <details>
                        <summary className="cursor-pointer text-sm font-semibold text-gray-600 hover:text-gray-800">
                            過去のライブ（{pastPerformances.length}件）
                        </summary>
                        <div className="mt-3 space-y-3">
                            {pastPerformances.map((x) => (
                                <PerformanceCard key={x.performance_id} x={x} />
                            ))}
                        </div>
                    </details>
                </section>
            )}

            <footer className="pt-4 text-center text-[11px] text-gray-400">
                Powered by Soundwalk
            </footer>
        </main>
    );
}
