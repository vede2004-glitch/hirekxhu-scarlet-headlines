import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/PageShell";
import { NewsFeed } from "@/components/NewsFeed";

export const Route = createFileRoute("/friss")({
  head: () => meta("Friss hírek – HIREKX.hu", "Minden AI-összesített magyar hír időrendben, a legújabbakkal kezdve, eredeti forrásokkal."),
  component: FreshNews,
});

function FreshNews() {
  return <NewsFeed view="latest" />;
}
