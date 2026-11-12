import { describe, expect, test } from "vitest";
import { applyLiveNews, archive, byRelevance, bundledNewsMeta, getNewsVersion, history, news, normalizeNewsList, singles, synthesized } from "./news";

const FRESH_ID = "group_2000000000_1";
const freshRaw = [
  {
    group_id: FRESH_ID,
    category: "Politika",
    image: null,
    is_synthesized: true,
    published_at: 2000000000,
    sources: [{ source: "Maszol", title: "Cím", link: "https://maszol.ro/hir" }],
    title_hu: "Friss hír",
    lead_hu: "Bevezető",
    content_hu: "Törzs",
  },
];

describe("elo news.json frissites", () => {
  test("a szemét nem lista", () => {
    expect(normalizeNewsList("nem lista")).toEqual([]);
    expect(normalizeNewsList(null)).toEqual([]);
    expect(normalizeNewsList([{ no_id: 1 }])).toEqual([]);
  });

  test("a regi vagy ures lista nem valtja ki az elot", () => {
    expect(applyLiveNews([])).toBe(false);
    expect(applyLiveNews(normalizeNewsList([{ group_id: "group_100_1", title_hu: "Regi", sources: [], published_at: 100 }]))).toBe(false);
    expect(getNewsVersion()).toBe(0);
    expect(news.length).toBe(bundledNewsMeta.count);
  });

  test("az ujabb news.json kicsereli a listakat es jelez", () => {
    expect(applyLiveNews(normalizeNewsList(freshRaw))).toBe(true);
    expect(getNewsVersion()).toBe(1);
    expect(news.length).toBe(1);
    expect(news[0]?.group_id).toBe(FRESH_ID);
    expect(synthesized.map((n) => n.group_id)).toEqual([FRESH_ID]);
    expect(singles.length).toBe(0);
    expect(byRelevance.some((n) => n.group_id === FRESH_ID)).toBe(true);
    expect(history.some((n) => n.group_id === FRESH_ID)).toBe(false);
  });

  test("a mar bevett ujabb lista nem noveli tobbbsszor a verziot", () => {
    expect(applyLiveNews(normalizeNewsList(freshRaw))).toBe(false);
    expect(getNewsVersion()).toBe(1);
  });

  test("a top_rank csak pozitiv szamkent jon at a normalizalasbol", () => {
    expect(normalizeNewsList([{ group_id: "r1", title_hu: "A", sources: [], top_rank: 3 }])[0]?.top_rank).toBe(3);
    expect(normalizeNewsList([{ group_id: "r2", title_hu: "B", sources: [], top_rank: 0 }])[0]?.top_rank).toBeNull();
    expect(normalizeNewsList([{ group_id: "r3", title_hu: "C", sources: [], top_rank: null }])[0]?.top_rank).toBeNull();
    expect(normalizeNewsList([{ group_id: "r4", title_hu: "D", sources: [] }])[0]?.top_rank).toBeNull();
  });

  test("az is_top_hero jeloles atjon a normalizalasbol", () => {
    expect(normalizeNewsList([{ group_id: "g1", title_hu: "A", sources: [], is_top_hero: true }])[0]?.is_top_hero).toBe(true);
    expect(normalizeNewsList([{ group_id: "g2", title_hu: "B", sources: [], is_top_hero: false }])[0]?.is_top_hero).toBe(false);
    expect(normalizeNewsList([{ group_id: "g3", title_hu: "C", sources: [] }])[0]?.is_top_hero).toBe(false);
  });
});
