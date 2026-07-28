/** @jest-environment node */

jest.mock("server-only", () => ({}));

const mockFrom = jest.fn();

jest.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: jest.fn(() => ({ from: mockFrom })),
}));

import { getPublicActLivesDb } from "@/lib/db/publicLives";

function makeQuery(methods: string[], result: unknown) {
  const query: Record<string, jest.Mock> = {};
  for (const method of methods) {
    query[method] = jest.fn(() => query);
  }
  const lastMethod = methods[methods.length - 1];
  query[lastMethod] = jest.fn(() => result);
  return query;
}

describe("getPublicActLivesDb", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("非公開/存在しない slug は null を返し、公演の照会は行わない", async () => {
    mockFrom.mockReturnValueOnce(
      makeQuery(["select", "eq", "eq", "maybeSingle"], { data: null, error: null })
    );

    await expect(getPublicActLivesDb("unknown-slug", "2026-07-28")).resolves.toBeNull();

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith("act_public_pages");
  });

  it("is_public=true を明示的にフィルタしている", async () => {
    const pageQuery = makeQuery(["select", "eq", "eq", "maybeSingle"], { data: null, error: null });
    mockFrom.mockReturnValueOnce(pageQuery);

    await getPublicActLivesDb("the-holidays", "2026-07-28");

    expect(pageQuery.eq).toHaveBeenNthCalledWith(1, "slug", "the-holidays");
    expect(pageQuery.eq).toHaveBeenNthCalledWith(2, "is_public", true);
  });

  it("キャンセル済み公演・未確定(matchedでない)企画の公演を除外し、個人ライブはそのまま含める", async () => {
    const pageQuery = makeQuery(["select", "eq", "eq", "maybeSingle"], {
      data: {
        act_id: "act-1",
        acts: {
          id: "act-1",
          name: "ザ・ホリデイズ",
          photo_url: "https://example.com/holidays.jpg",
          profile_link_url: "https://x.com/theholidays",
        },
      },
      error: null,
    });

    const perfQuery = makeQuery(["select", "eq", "neq", "gte", "order"], {
      data: [
        {
          event_date: "2026-09-12",
          venue_name: "水戸○○",
          open_time: "18:30:00",
          start_time: "19:00:00",
          details: { customer_charge_yen: 2000 },
          events: { title: "○○ LIVE", charge: 2500, status: "matched" },
        },
        {
          // 企画に紐づくが未確定(open)なので除外される
          event_date: "2026-10-01",
          venue_name: "別会場",
          open_time: null,
          start_time: null,
          details: null,
          events: { title: "未確定企画", charge: null, status: "open" },
        },
        {
          // 企画に紐づかない個人ライブはそのまま公開される
          event_date: "2026-11-01",
          venue_name: "ソロ会場",
          open_time: "19:00:00",
          start_time: "19:30:00",
          details: { customer_charge_yen: 1500 },
          events: null,
        },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "act_public_pages") return pageQuery;
      if (table === "musician_performances") return perfQuery;
      throw new Error(`unexpected table: ${table}`);
    });

    const result = await getPublicActLivesDb("the-holidays", "2026-07-28");

    expect(result?.artist).toEqual({
      name: "ザ・ホリデイズ",
      slug: "the-holidays",
      photo_url: "https://example.com/holidays.jpg",
      profile_link_url: "https://x.com/theholidays",
    });

    expect(result?.events).toEqual([
      {
        title: "○○ LIVE",
        date: "2026-09-12",
        open_time: "18:30",
        start_time: "19:00",
        venue: "水戸○○",
        charge: 2500,
      },
      {
        title: null,
        date: "2026-11-01",
        open_time: "19:00",
        start_time: "19:30",
        venue: "ソロ会場",
        charge: 1500,
      },
    ]);

    expect(perfQuery.neq).toHaveBeenCalledWith("status", "canceled");
    expect(perfQuery.gte).toHaveBeenCalledWith("event_date", "2026-07-28");
  });
});
