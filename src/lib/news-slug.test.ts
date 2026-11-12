import { describe, expect, test } from "vitest";
import { newsSlug } from "./news-slug";
import { getNews, news } from "./news";

describe("readable article URLs", () => {
  test("uses the Hungarian title rather than a group identifier", () => {
    expect(newsSlug({ title: "Árvíz: új hírek Budapestről" })).toBe("arviz-uj-hirek-budapestrol");
  });
  test("distinguishes same-title stories published at different times", () => {
    expect(newsSlug({ title: "Hír", published_at: 1792497600 })).not.toBe(newsSlug({ title: "Hír", published_at: 1792497660 }));
  });
  test("both old and readable addresses resolve to the same article", () => {
    const item = news[0];
    if (!item) throw new Error("Missing news fixture");
    expect(getNews(item.group_id)).toBe(item);
    expect(getNews(newsSlug(item))).toBe(item);
  });
});