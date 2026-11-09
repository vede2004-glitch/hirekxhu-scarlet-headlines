import { describe, expect, it } from "vitest";
import { normalizeNewsList } from "./news";
import { splitNewsFeed } from "./news-feed";

const items = normalizeNewsList(Array.from({ length: 12 }, (_, i) => ({
  group_id: `story-${i}`, title_hu: `Story ${i}`, sources: [],
  published_at: [100, 900, 200, 800, 300, 700, 400, 600, 1100, 1300, 1200, null][i],
  is_synthesized: i % 2 === 0,
})));

describe("news feed views", () => {
  it("keeps the first eight stories in their exact original order", () => {
    expect(splitNewsFeed(items).top.map(n => n.group_id)).toEqual([
      "story-0", "story-1", "story-2", "story-3", "story-4", "story-5", "story-6", "story-7",
    ]);
  });
  it("sorts all remaining stories newest first, including synthesized stories", () => {
    expect(splitNewsFeed(items).latest.map(n => n.group_id)).toEqual(["story-9", "story-10", "story-8", "story-11"]);
  });
  it("excludes every featured story from the chronological list", () => {
    const { top, latest } = splitNewsFeed(items);
    expect(latest.filter(n => top.some(t => t.group_id === n.group_id)) ).toEqual([]);
    expect(latest).toHaveLength(4);
  });
  it("does not mutate the input and handles short or empty feeds", () => {
    const before = items.map(n => n.group_id);
    splitNewsFeed(items);
    expect(items.map(n => n.group_id)).toEqual(before);
    expect(splitNewsFeed(items.slice(0, 3))).toEqual({ top: items.slice(0, 3), latest: [] });
    expect(splitNewsFeed([])).toEqual({ top: [], latest: [] });
  });
});