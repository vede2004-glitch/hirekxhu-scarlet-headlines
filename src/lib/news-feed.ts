import type { NewsItem } from "@/lib/news";

export type NewsFeedSplit = {
  /** A kiemelt cikk: a jelölt, vagy ha nincs jelölés, az első cikk. Üres hírfájlban `null`. */
  hero: NewsItem | null;
  top: NewsItem[];
  latest: NewsItem[];
  singles: NewsItem[];
};

/**
 * Classify before display filters; both main views contain the complete AI set
 * except the hero story, which is rendered once, at the top of the page.
 */
export function splitNewsFeed(items: readonly NewsItem[]): NewsFeedSplit {
  const hero = items.find(item => item.is_top_hero === true) ?? items[0] ?? null;
  const rest = hero ? items.filter(item => item.group_id !== hero.group_id) : [...items];
  const newestFirst = (a: NewsItem, b: NewsItem) => (b.published_at ?? 0) - (a.published_at ?? 0);
  const top = rest.filter(item => item.is_synthesized);
  const latest = [...top].sort(newestFirst);
  const singles = rest.filter(item => !item.is_synthesized).sort(newestFirst);
  return { hero, top, latest, singles };
}
