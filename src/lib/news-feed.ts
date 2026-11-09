import type { NewsItem } from "@/lib/news";

export const TOP_NEWS_COUNT = 8;

/** Split before applying search/category filters so featured stories never repeat. */
export function splitNewsFeed(items: readonly NewsItem[]) {
  const top = items.slice(0, TOP_NEWS_COUNT);
  const topIds = new Set(top.map((item) => item.group_id));
  const latest = items
    .filter((item) => !topIds.has(item.group_id))
    .sort((a, b) => (b.published_at ?? 0) - (a.published_at ?? 0));
  return { top, latest };
}