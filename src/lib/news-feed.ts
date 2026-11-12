import type { NewsItem } from "@/lib/news";

export type NewsFeedSplit = {
  /** A kiemelt cikk: a `top_rank === 1` hír (vagy visszaesésnél a jelölt / első). Üres hírfájlban `null`. */
  hero: NewsItem | null;
  /** Toplista: csak az érvényes `top_rank`-kal rendelkező hírek, helyezés szerint, a hero nélkül. */
  top: NewsItem[];
  /** Friss: az összes hír, szigorúan `published_at` szerint csökkenő sorrendben. */
  latest: NewsItem[];
  /** Hírfolyam: az egyforrású (nem AI-összesített) hírek, időrendben. */
  singles: NewsItem[];
};

const newestFirst = (a: NewsItem, b: NewsItem) => (b.published_at ?? 0) - (a.published_at ?? 0);

const hasRank = (n: NewsItem): n is NewsItem & { top_rank: number } =>
  typeof n.top_rank === "number" && n.top_rank > 0;

/**
 * Classify before display filters. The Top view is driven by the backend's
 * explicit `top_rank`; the Fresh view is the complete feed in strict
 * chronological order. The hero is rendered once, at the top of the page,
 * and never again inside any list below it.
 */
export function splitNewsFeed(items: readonly NewsItem[]): NewsFeedSplit {
  const ranked = items.filter(hasRank).sort((a, b) => a.top_rank - b.top_rank);
  // Visszaesés, amíg a backend nem ad top_rank-ot: a régi jelölés / első AI-hír.
  const hero = ranked[0] ?? items.find((i) => i.is_top_hero) ?? items.find((i) => i.is_synthesized) ?? items[0] ?? null;
  const top = ranked.length
    ? ranked.slice(1)
    : items.filter((i) => i.is_synthesized && i.group_id !== hero?.group_id);
  const latest = [...items].sort(newestFirst);
  const singles = items.filter((i) => !i.is_synthesized).sort(newestFirst);
  return { hero, top, latest, singles };
}
