import { createFileRoute } from "@tanstack/react-router";
import { NewsFeed } from "@/components/NewsFeed";
import { meta } from "@/components/PageShell";

export const Route = createFileRoute("/")({
  head: () => meta("Friss hírek – HIREKX.hu", "Minden AI-összesített magyar hír időrendben, a legújabbakkal kezdve, eredeti forrásokkal."),
  component: FreshNews,
});

function FreshNews() {
  return <NewsFeed view="latest" />;
}
