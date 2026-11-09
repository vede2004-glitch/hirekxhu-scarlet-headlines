import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/PageShell";
import { NewsFeed } from "@/components/NewsFeed";

export const Route = createFileRoute("/friss")({
  head: () => meta("Friss hírek – HIREKX.hu", "Magyar hírek időrendben, a legújabbakkal kezdve: minden további hír, a Top hírek ismétlése nélkül, eredeti forrásokkal és AI-összefoglalókkal."),
  component: FreshNews,
});

function FreshNews() {
  return <NewsFeed view="latest" />;
}
