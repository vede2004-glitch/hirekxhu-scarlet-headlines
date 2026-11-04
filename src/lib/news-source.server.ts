// Friss news.json letöltése a projekt saját GitHub-tárhelyéről, hogy a
// [skip ci]-vel kommitolt hírek újraépítés nélkül is megjelenjenek.
// Elsőként a raw.githubusercontent.com-ot használjuk: a Cloudflare közös
// IP-címeiről az api.github.com kulcs nélkül gyorsan korlátozást (403) ad.
const REPO = "vede2004-glitch/hirekxhu-scarlet-headlines";
const BRANCH = "main";
const PATH = "src/data/news.json";

let cache: { at: number; text: string } | null = null;
const TTL_MS = 60 * 1000;

async function tryFetch(url: string, headers: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(url, { headers, cache: "no-store" } as RequestInit);
    if (!res.ok) {
      console.error(`news.json letöltés sikertelen [${res.status}] ${url}`);
      return null;
    }
    const text = await res.text();
    return text.trim().startsWith("[") ? text : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function fetchRepoNewsText(): Promise<string | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.text;
  const token = process.env["GITHUB_TOKEN"];
  const base: Record<string, string> = { "User-Agent": "hirekx-news" };
  if (token) base["Authorization"] = `Bearer ${token}`;
  const t = Date.now();
  const text =
    (await tryFetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${PATH}?t=${t}`, base)) ??
    (await tryFetch(`https://api.github.com/repos/${REPO}/contents/${PATH}?t=${t}`, {
      ...base,
      Accept: "application/vnd.github.raw+json",
    }));
  if (!text) return cache?.text ?? null;
  cache = { at: Date.now(), text };
  return text;
}
