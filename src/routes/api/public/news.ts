import { createFileRoute } from "@tanstack/react-router";
import raw from "@/data/news.json";
import { bundledNewsMeta, normalizeNewsList } from "@/lib/news";

// Elsődleges forrás: a GitHub-tárhelyen lévő friss news.json; ha nem érhető el,
// a beépített példány.
const NO_STORE = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
};

export const Route = createFileRoute("/api/public/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { fetchRepoNewsText } = await import("@/lib/news-source.server");
        const text = (await fetchRepoNewsText()) ?? JSON.stringify(raw);
        const url = new URL(request.url);
        if (url.searchParams.get("meta") === "1") {
          let meta = bundledNewsMeta;
          try {
            const items = normalizeNewsList(JSON.parse(text));
            meta = {
              count: items.length,
              latest: items.reduce((m, n) => Math.max(m, n.published_at ?? 0), 0),
              synthesized: items.filter((n) => n.is_synthesized).length,
            };
          } catch {
            // marad a beépített
          }
          return Response.json(meta, { headers: NO_STORE });
        }
        return new Response(text, { headers: NO_STORE });
      },
    },
  },
});
