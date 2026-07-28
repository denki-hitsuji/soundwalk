// app/docs/api/live-events/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ライブ情報 公開API仕様 | Soundwalk",
  description:
    "Soundwalkに登録されたアクト（バンド）の過去・今後のライブ情報を取得する公開APIのリファレンスです。",
};

const RESPONSE_EXAMPLE = `{
  "artist": {
    "name": "ザ・ホリデイズ",
    "slug": "the-holidays",
    "photo_url": "https://example.com/holidays.jpg",
    "profile_link_url": "https://x.com/theholidays"
  },
  "events": [
    {
      "title": "過去のワンマン",
      "date": "2026-01-15",
      "open_time": "18:00",
      "start_time": "18:30",
      "venue": "水戸△△",
      "charge": 2000
    },
    {
      "title": "○○ LIVE",
      "date": "2026-09-12",
      "open_time": "18:30",
      "start_time": "19:00",
      "venue": "水戸○○",
      "charge": 2500
    }
  ]
}`;

const ERROR_EXAMPLE = `{
  "error": "Not Found"
}`;

const CURL_EXAMPLE = `curl https://soundwalk.net/api/public/bands/the-holidays/lives`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-gray-900 p-4 text-xs text-gray-100">
      <code>{code}</code>
    </pre>
  );
}

type FieldRow = { name: string; type: string; note: string };

function FieldTable({ rows }: { rows: FieldRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="px-3 py-2 font-semibold">フィールド</th>
            <th className="px-3 py-2 font-semibold">型</th>
            <th className="px-3 py-2 font-semibold">説明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t">
              <td className="px-3 py-2 font-mono text-gray-900">{row.name}</td>
              <td className="px-3 py-2 font-mono text-gray-500">{row.type}</td>
              <td className="px-3 py-2">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function LiveEventsApiDocsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Soundwalk Public API
        </p>
        <h1 className="text-2xl font-bold text-gray-900">ライブ情報 公開API</h1>
        <p className="text-sm text-gray-600">
          Soundwalkに登録されたアクト（バンド）ごとの、過去・今後すべてのライブ情報をJSONで取得できます。認証は不要です。
        </p>
      </header>

      <Section title="概要">
        <ul className="list-disc space-y-1 pl-5">
          <li>認証: 不要（公開API）</li>
          <li>形式: JSON</li>
          <li>
            <strong>過去・今後を問わずすべてのライブ</strong>を日付昇順で返します。「今後のライブ一覧」「過去のアーカイブ」を分けて表示したい場合は、取得後に各イベントの <code className="rounded bg-gray-100 px-1 py-0.5 font-mono">date</code> を今日の日付と比較して振り分けてください（本APIへのリクエストは1回で済みます）。
          </li>
          <li>キャンセル済み・開催未確定のライブは含まれません</li>
        </ul>
      </Section>

      <Section title="エンドポイント">
        <p>
          <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-900">
            GET /api/public/bands/{"{slug}"}/lives
          </code>
        </p>

        <FieldTable
          rows={[
            {
              name: "slug",
              type: "string（パスパラメータ）",
              note: "アクトの公開ページに割り当てられた識別子（例: the-holidays）。Soundwalk上のアクト公開ページURLの末尾と同じ値です。",
            },
          ]}
        />
      </Section>

      <Section title="レスポンス（200 OK）">
        <CodeBlock code={RESPONSE_EXAMPLE} />

        <p className="font-semibold text-gray-900">artist</p>
        <FieldTable
          rows={[
            { name: "name", type: "string", note: "アクト名" },
            { name: "slug", type: "string", note: "リクエストで指定したslugと同じ値" },
            { name: "photo_url", type: "string | null", note: "アー写のURL" },
            { name: "profile_link_url", type: "string | null", note: "公式サイト・SNS等の外部リンク" },
          ]}
        />

        <p className="font-semibold text-gray-900">events（配列・日付の昇順）</p>
        <FieldTable
          rows={[
            {
              name: "title",
              type: "string | null",
              note: "ライブ（企画）のタイトル。個別ライブとして登録されている場合は null になることがあります。表示時はアクト名等でのフォールバックを推奨します。",
            },
            { name: "date", type: "string（YYYY-MM-DD）", note: "開催日" },
            { name: "open_time", type: "string（HH:mm）| null", note: "開場時刻" },
            { name: "start_time", type: "string（HH:mm）| null", note: "開演時刻" },
            { name: "venue", type: "string", note: "会場名" },
            { name: "charge", type: "number | null", note: "料金（円）" },
          ]}
        />
      </Section>

      <Section title="エラーレスポンス">
        <CodeBlock code={ERROR_EXAMPLE} />
        <FieldTable
          rows={[
            { name: "404", type: "Not Found", note: "指定したslugのアクトが存在しない、または非公開です。" },
            {
              name: "429",
              type: "Too Many Requests",
              note: "リクエスト数が上限を超えました。レスポンスの Retry-After ヘッダ（秒数）だけ待ってから再試行してください。",
            },
            { name: "500", type: "Internal Server Error", note: "サーバー側で問題が発生しました。時間を置いて再試行してください。" },
          ]}
        />
      </Section>

      <Section title="キャッシュ・呼び出し頻度">
        <p>
          レスポンスには <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">Cache-Control: public, max-age=300</code>{" "}
          が付与されます。5分以内の再取得はキャッシュされた内容が返る想定で構いません。
        </p>
        <p>
          同一IPからのリクエストは<strong>60秒あたり60回まで</strong>に制限されています。静的サイトのビルド時に1アクトにつき1回程度取得する使い方であれば問題になりません。
        </p>
      </Section>

      <Section title="呼び出し例">
        <CodeBlock code={CURL_EXAMPLE} />
      </Section>

      <footer className="border-t pt-6 text-xs text-gray-400">
        Soundwalk Public API — このページに記載のない仕様は未定義であり、将来変更される可能性があります。
      </footer>
    </main>
  );
}
