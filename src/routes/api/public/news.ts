import { createFileRoute } from "@tanstack/react-router";
import raw from "@/data/news.json";
import { bundledNewsMeta } from "@/lib/news";

// Egyetlen hírforrás a helyi src/data/news.json: a Python szkriptek ebbe írják
// a magyar híreket, és az oldal csak ebből szolgáltat (semmi külső letöltés).
const NO_STORE = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
};

export const Route = createFileRoute("/api/public/news")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("meta") === "1") {
          return Response.json(bundledNewsMeta, { headers: NO_STORE });
        }
        return new Response(JSON.stringify(raw), { headers: NO_STORE });
      },
    },
  },
});
