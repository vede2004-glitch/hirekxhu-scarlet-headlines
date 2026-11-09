import { createFileRoute } from "@tanstack/react-router";
import { NewsFeed } from "@/components/NewsFeed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Top hírek – HIREKX.hu" },
      { name: "description", content: "A legfrissebb magyar hírek egy helyen: Telex, 444, HVG, Index, Portfolio és más portálok cikkei AI-összefoglalókkal, forrásmegjelöléssel." },
      { property: "og:title", content: "Top hírek – HIREKX.hu" },
      { property: "og:description", content: "A legfrissebb magyar hírek egy helyen: Telex, 444, HVG, Index, Portfolio és más portálok cikkei AI-összefoglalókkal, forrásmegjelöléssel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TopNews,
});

function TopNews() {
  return <NewsFeed view="top" />;
}
