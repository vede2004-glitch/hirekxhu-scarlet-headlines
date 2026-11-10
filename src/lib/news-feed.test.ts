import { describe, expect, it } from "vitest";
import { normalizeNewsList } from "./news";
import { splitNewsFeed } from "./news-feed";

const raw = Array.from({ length: 12 }, (_, i) => ({
  group_id: `story-${i}`, title_hu: `Story ${i}`, sources: [],
  published_at: [100, 900, 200, 800, 300, 700, 400, 600, 1100, 1300, 1200, null][i],
  is_synthesized: i % 2 === 0,
  is_top_hero: i === 4,
}));
const items = normalizeNewsList(raw);
const noFlag = normalizeNewsList(raw.map(({ is_top_hero, ...r }) => r));

describe("news feed views", () => {
  it("takes the hero from the is_top_hero flag, wherever it sits in the file", () => {
    expect(items[4]?.is_top_hero).toBe(true);
    expect(splitNewsFeed(items).hero?.group_id).toBe("story-4");
  });
  it("falls back to the first article when nothing is flagged", () => {
    expect(splitNewsFeed(noFlag).hero?.group_id).toBe("story-0");
  });
  it("never renders the hero again inside any feed view", () => {
    for (const set of [items, noFlag]) {
      const { hero, top, latest, singles } = splitNewsFeed(set);
      const id = hero?.group_id;
      expect(id).toBeTruthy();
      expect(top.map(n => n.group_id)).not.toContain(id);
      expect(latest.map(n => n.group_id)).not.toContain(id);
      expect(singles.map(n => n.group_id)).not.toContain(id);
      expect(top.some(n => n.is_top_hero)).toBe(false);
      expect(latest.some(n => n.is_top_hero)).toBe(false);
    }
  });
  it("keeps every remaining AI story in original order in Top, without an eight-story limit", () => {
    expect(splitNewsFeed(items).top.map(n => n.group_id)).toEqual([
      "story-0", "story-2", "story-6", "story-8", "story-10",
    ]);
    const many = normalizeNewsList(Array.from({ length: 12 }, (_, i) => ({ group_id: `ai-${i}`, title_hu: `AI ${i}`, sources: [], is_synthesized: true })));
    const { hero, top } = splitNewsFeed(many);
    expect(hero?.group_id).toBe("ai-0");
    expect(top).toHaveLength(11);
  });
  it("shows every remaining AI story in Latest, strictly newest first", () => {
    expect(splitNewsFeed(items).latest.map(n => n.group_id)).toEqual(["story-10", "story-8", "story-6", "story-2", "story-0"]);
  });
  it("includes the same complete AI set on both pages", () => {
    const { top, latest } = splitNewsFeed(items);
    expect(latest.map(n => n.group_id).sort()).toEqual(top.map(n => n.group_id).sort());
  });
  it("puts only non-AI stories in the separate chronological stream", () => {
    expect(splitNewsFeed(items).singles.map(n => n.group_id)).toEqual(["story-9", "story-1", "story-3", "story-5", "story-7", "story-11"]);
  });
  it("does not mutate the input and handles short or empty feeds", () => {
    const before = items.map(n => n.group_id);
    splitNewsFeed(items);
    expect(items.map(n => n.group_id)).toEqual(before);
    expect(splitNewsFeed(items.slice(0, 5))).toEqual({
      hero: items[4],
      top: [items[0], items[2]],
      latest: [items[2], items[0]],
      singles: [items[1], items[3]],
    });
    expect(splitNewsFeed(items.slice(0, 3))).toEqual({ hero: items[0], top: [items[2]], latest: [items[2]], singles: [items[1]] });
    expect(splitNewsFeed([])).toEqual({ hero: null, top: [], latest: [], singles: [] });
  });
});
