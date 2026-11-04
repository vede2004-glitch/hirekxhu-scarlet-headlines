// Friss news.json letöltése a projekt saját GitHub-tárhelyéről, hogy a
// [skip ci]-vel kommitolt hírek újraépítés nélkül is megjelenjenek.
const REPO = "vede2004-glitch/hirekxhu-scarlet-headlines";
const PATH = "src/data/news.json";

let cache: { at: number; text: string } | null = null;
const TTL_MS = 60 * 1000;

export async function fetchRepoNewsText(): Promise<string | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.text;
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": "hirekx-news",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${PATH}?t=${Date.now()}`, { headers });
    if (!res.ok) {
      console.error(`news.json letöltés sikertelen [${res.status}]`);
      return cache?.text ?? null;
    }
    const text = await res.text();
    if (!text.trim().startsWith("[")) return cache?.text ?? null;
    cache = { at: Date.now(), text };
    return text;
  } catch (e) {
    console.error(e);
    return cache?.text ?? null;
  }
}
