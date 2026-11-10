import { describe, expect, it } from "vitest";
import { normalizeNewsList, getNews, news } from "./news";

const raw = {
  group_id: "group_legacy_example",
  slug: "magyar-hir-olvashato-cimmel",
  title_hu: "Magyar hír olvasható címmel",
  sources: [],
  image: null,
  is_synthesized: true,
};

describe("article slug routing", () => {
  it("preserves the slug supplied by news.json and the Hungarian title", () => {
    const [item] = normalizeNewsList([raw]);
    expect(item).toHaveProperty("slug", "magyar-hir-olvashato-cimmel");
    expect(item?.title).toBe("Magyar hír olvasható címmel");
  });

  it("resolves a supplied slug before a conflicting legacy group ID", () => {
    const items = normalizeNewsList([
      { ...raw, group_id: raw.slug, slug: "masik-hir" },
      raw,
    ]);
    news.push(...items);
    try {
      expect(getNews(raw.slug)?.group_id).toBe("group_legacy_example");
    } finally {
      news.splice(news.length - items.length, items.length);
    }
  });

  it("continues to resolve old group ID links", () => {
    const items = normalizeNewsList([raw]);
    news.push(...items);
    try {
      expect(getNews("group_legacy_example")?.title).toBe("Magyar hír olvasható címmel");
      expect(getNews("missing-article")).toBeUndefined();
    } finally {
      news.splice(news.length - items.length, items.length);
    }
  });
});