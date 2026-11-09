import { createFileRoute } from "@tanstack/react-router";
import { meta } from "@/components/PageShell";
import { NewsFeed } from "@/components/NewsFeed";

export const Route = createFileRoute("/hirfolyam")({
  head: () => meta("Hírfolyam – HIREKX.hu", "Magyar portálok egyforrású hírei időrendben, közvetlen hivatkozással az eredeti cikkekhez."),
  component: () => <NewsFeed view="singles" />,
});