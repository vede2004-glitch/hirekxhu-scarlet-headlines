import { createServerFn } from "@tanstack/react-start";

// A szerver a GitHub-tárhelyről veszi a legfrissebb news.json-t.
export const getLiveNews = createServerFn({ method: "GET" }).handler(async (): Promise<string | null> => {
  const { fetchRepoNewsText } = await import("@/lib/news-source.server");
  return fetchRepoNewsText();
});
