import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/PageShell";
import { NewsFeed } from "@/components/NewsFeed";

export const Route = createFileRoute("/friss")({
  head: () => meta("Top hírek – HIREKX.hu", "A legfontosabb magyar hírek rangsorolva, AI-összefoglalókkal és eredeti forrásokkal."),
  component: TopNews,
});

function TopNews() {
  return <NewsFeed view="top" />;
}
