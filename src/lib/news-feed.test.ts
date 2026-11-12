import { describe, expect, it } from "vitest";
import { normalizeNewsList } from "./news";
import { splitNewsFeed } from "./news-feed";

const raw = Array.from({ length: 12 }, (_, i) => ({
  group_id: `story-${i}`, title_hu: `Story ${i}`, sources: [],
  published_at: [100, 900, 200, 800, 300, 700, 400, 600, 1100, 1300, 1200, null][i],
  is_synthesized: i % 2 === 0,
  is_top_hero: i === 4,
  top_rank: { 0: 2, 4: 1, 6: 3, 8: 0 }[i] ?? null,
}));
const items = normalizeNewsList(raw);
const noRank = normalizeNewsList(raw.map(({ top_rank, ...r }) => r));

describe("news feed views", () => {
  it("takes the hero from top_rank 1 and never renders it again in the grid", () => {
    const { hero, top } = splitNewsFeed(items);
    expect(hero?.group_id).toBe("story-4");
    expect(top.map((n) => n.group_id)).not.toContain("story-4");
  });
  it("shows only ranked stories in the Top view, strictly in top_rank order", () => {
    expect(splitNewsFeed(items).top.map((n) => [n.group_id, n.top_rank])).toEqual([
      ["story-0", 2],
      ["story-6", 3],
    ]);
  });
  it("ignores invalid top_rank values (0, null, missing)", () => {
    const { hero, top } = splitNewsFeed(items);
    expect([hero, ...top].map((n) => n?.group_id)).not.toContain("story-8");
  });
  it("falls back to the is_top_hero flag, then the first story, when nothing is ranked", () => {
    const { hero, top } = splitNewsFeed(noRank);
    expect(hero?.group_id).toBe("story-4");
    expect(top.map((n) => n.group_id)).toEqual(["story-0", "story-2", "story-6", "story-8", "story-10"]);
    const plain = normalizeNewsList(raw.map(({ top_rank, is_top_hero, ...r }) => r));
    expect(splitNewsFeed(plain).hero?.group_id).toBe("story-0");
  });
  it("shows every AI story in the Fresh view, strictly newest first, singles excluded", () => {
    expect(splitNewsFeed(items).latest.map((n) => n.group_id)).toEqual([
      "story-10", "story-8", "story-6", "story-4", "story-2", "story-0",
    ]);
  });
  it("keeps Top and Fresh as different orderings over the same AI set", () => {
    const { hero, top, latest } = splitNewsFeed(items);
    const allAi = items.filter((n) => n.is_synthesized).map((n) => n.group_id).sort();
    expect(latest.map((n) => n.group_id).sort()).toEqual(allAi);
    expect([hero, ...top].map((n) => n?.group_id).sort()).toEqual(["story-0", "story-4", "story-6"]);
  });
  it("puts only non-AI stories in the separate chronological stream", () => {
    expect(splitNewsFeed(items).singles.map((n) => n.group_id)).toEqual(["story-9", "story-1", "story-3", "story-5", "story-7", "story-11"]);
  });
  it("does not mutate the input and handles short or empty feeds", () => {
    const before = items.map((n) => n.group_id);
    splitNewsFeed(items);
    expect(items.map((n) => n.group_id)).toEqual(before);
    const short = splitNewsFeed(items.slice(0, 5));
    expect(short.hero?.group_id).toBe("story-4");
    expect(short.top.map((n) => n.group_id)).toEqual(["story-0"]);
    expect(short.latest.map((n) => n.group_id)).toEqual(["story-4", "story-2", "story-0"]);
    expect(splitNewsFeed([])).toEqual({ hero: null, top: [], latest: [], singles: [] });
  });
});
