import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { PageShell, meta, field } from "@/components/PageShell";
import { RichText } from "@/components/RichText";
import { Button } from "@/components/ui/button";
import { singles, formatDate, timeAgo, CATEGORIES, ALL, type NewsItem } from "@/lib/news";
import { useNewsVersion } from "@/lib/news-live";

export const Route = createFileRoute("/friss")({
  head: () => meta("Friss hírek – HIREKX.hu", "Az egyforrású, még össze nem fűzött legfrissebb magyar hírek időrendben, az eredeti portálra mutató linkkel."),
  component: FreshNews,
});

function FreshNews() {
  const version = useNewsVersion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const list = useMemo(() => {
    const q = query.toLocaleLowerCase("hu");
    return singles.filter((n: NewsItem) => (category === ALL || n.category === category) && `${n.title} ${n.lead}`.toLocaleLowerCase("hu").includes(q)).slice(0, 300);
  }, [query, category, version]);

  return (
    <PageShell eyebrow="Élő hírfolyam" title="Friss hírek" intro="Azok a hírek, amelyekről egyelőre csak egy portál írt, ezért nem készült hozzájuk AI-összefoglaló. Kattintásra az eredeti cikk nyílik meg.">
      <div className="mb-6 flex flex-col gap-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Keresés a friss hírek között..." className={field} />
        <div className="flex gap-2 overflow-x-auto">
          {[ALL, ...CATEGORIES].map((c) => <Button key={c} size="sm" variant={category === c ? "default" : "ghost"} onClick={() => setCategory(c)} className="whitespace-nowrap">{c}</Button>)}
        </div>
      </div>
      <ol className="divide-y divide-border rounded-lg border border-border bg-card">
        {list.map((n) => {
          const src = n.sources[0];
          const body = <>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">{timeAgo(n.published_at)} · {formatDate(n.published_at)} · <span className="text-primary">{src?.source ?? "Ismeretlen forrás"}</span> · {n.category}</p>
            <h2 className="mt-1 font-display text-base font-bold leading-snug group-hover:text-primary"><RichText text={n.title} /></h2>
            {n.lead && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground"><RichText text={n.lead} /></p>}
          </>;
          return <li key={n.group_id}>{src?.link
            ? <a href={src.link} target="_blank" rel="noopener noreferrer" className="group flex gap-3 p-4 transition-colors hover:bg-secondary"><div className="min-w-0 flex-1">{body}</div><ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" /></a>
            : <Link to="/hir/$id" params={{ id: n.group_id }} className="group block p-4 transition-colors hover:bg-secondary">{body}</Link>}</li>;
        })}
        {!list.length && <li className="p-8 text-center text-sm text-muted-foreground">Nincs találat.</li>}
      </ol>
    </PageShell>
  );
}
