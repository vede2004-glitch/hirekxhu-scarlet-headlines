import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock3, Flame, Layers3, Search, ExternalLink } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteMenu } from "@/components/SiteMenu";
import { RichText } from "@/components/RichText";
import { Button, buttonVariants } from "@/components/ui/button";
import { news, CATEGORIES, ALL, formatDate, type NewsItem } from "@/lib/news";
import { splitNewsFeed } from "@/lib/news-feed";
import { heroPhoto } from "@/lib/news-covers";
import { useNewsVersion } from "@/lib/news-live";
import { cn } from "@/lib/utils";

function Coverage({ item }: { item: NewsItem }) {
  return item.sources.length > 1 ? <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground"><Layers3 className="size-3" />{item.sources.length} forrás</span> : null;
}

function StoryLink({ item, className, children }: { item: NewsItem; className: string; children: React.ReactNode }) {
  const source = item.sources[0];
  return !item.is_synthesized && source?.link
    ? <a href={source.link} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    : <Link to="/hir/$id" params={{ id: item.group_id }} className={className}>{children}</Link>;
}

export function NewsFeed({ view }: { view: "top" | "latest" }) {
  const version = useNewsVersion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [limit, setLimit] = useState(60);
  const feed = useMemo(() => splitNewsFeed(news), [version]);
  const list = useMemo(() => (view === "top" ? feed.top : feed.latest).filter(item =>
    (category === ALL || item.category === category) &&
    `${item.title} ${item.lead}`.toLocaleLowerCase("hu").includes(query.toLocaleLowerCase("hu"))
  ), [feed, view, category, query]);

  return <div className="min-h-screen bg-background font-sans text-foreground">
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" aria-label="HIREKX.hu főoldal"><BrandLogo className="h-10 w-32 object-contain object-left sm:w-40" /></Link>
        <div className="flex items-center gap-4"><span className="hidden items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground sm:flex"><span className="size-2 rounded-full bg-primary animate-live" />Minden hír egy helyen</span><SiteMenu /></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:pt-8">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <nav aria-label="Hírnézetek" className="flex gap-2">
          <Link to="/" aria-current={view === "top" ? "page" : undefined} className={cn(buttonVariants({ variant: view === "top" ? "default" : "ghost", size: "default" }), "gap-2")}><Flame className="size-4" />Top hírek</Link>
          <Link to="/friss" aria-current={view === "latest" ? "page" : undefined} className={cn(buttonVariants({ variant: view === "latest" ? "default" : "ghost", size: "default" }), "gap-2")}><Clock3 className="size-4" />Friss hírek</Link>
        </nav>
        <label className="flex items-center gap-2 rounded-md border border-input bg-secondary px-3 sm:w-72"><Search className="size-4 shrink-0 text-muted-foreground" /><span className="sr-only">Keresés a hírek között</span><input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(60); }} placeholder="Keresés a hírek között…" className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label>
      </div>
      <nav aria-label="Hírkategóriák" className="flex gap-1 overflow-x-auto py-4">
        {[ALL, ...CATEGORIES].map(c => <Button key={c} variant={category === c ? "outline" : "ghost"} size="sm" aria-pressed={category === c} onClick={() => { setCategory(c); setLimit(60); }} className="whitespace-nowrap">{c}</Button>)}
      </nav>
      <div className="mb-6 mt-2 flex items-baseline justify-between gap-3"><h1 className="font-display text-2xl font-bold sm:text-3xl">{view === "top" ? "Top hírek" : "Friss hírek"}</h1><span className="shrink-0 text-xs text-muted-foreground">{list.length} hír</span></div>
      {view === "top" ? <section aria-label="Top hírek" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((item, index) => <article key={item.group_id} data-news-id={item.group_id} className={cn("min-w-0", index === 0 && "sm:col-span-2")}>
          <StoryLink item={item} className="group block h-full overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50">
            <div className={cn("relative overflow-hidden", index === 0 ? "aspect-[2/1]" : "aspect-[16/9]")}>
              <img src={heroPhoto(item.category, `${item.title} ${item.lead}`, item.group_id)} alt="" loading={index < 2 ? "eager" : "lazy"} className="absolute inset-0 size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105" />
              <div className="absolute left-3 top-3 flex gap-2"><span className="rounded-sm bg-background/90 px-2 py-1 text-[10px] font-bold text-foreground">{String(index + 1).padStart(2, "0")}</span><Coverage item={item} /></div>
            </div>
            <div className="p-4 sm:p-5"><div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase"><span className="text-primary">{item.category}</span><time className="text-muted-foreground" dateTime={item.published_at ? new Date(item.published_at * 1000).toISOString() : undefined}>{formatDate(item.published_at)}</time></div>
              <h2 className={cn("font-display font-bold leading-snug transition-colors group-hover:text-primary", index === 0 ? "text-xl sm:text-3xl" : "text-lg")}><RichText text={item.title} /></h2>
              {item.lead && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground"><RichText text={item.lead} /></p>}
              <p className="mt-4 border-t border-border pt-3 text-[10px] font-medium text-muted-foreground">{item.is_synthesized && <span className="mr-2 text-primary">✨ AI összesített</span>}{item.sources.slice(0, 3).map(s => s.source).join(" · ")}</p>
            </div>
          </StoryLink>
        </article>)}
      </section> : <ol aria-label="Friss hírek időrendben" className="divide-y divide-border border-t border-border">
        {list.slice(0, limit).map(item => <li key={item.group_id} data-news-id={item.group_id}>
          <StoryLink item={item} className="group grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-5 transition-colors hover:bg-secondary/40 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:gap-6 sm:py-6">
            <time dateTime={item.published_at ? new Date(item.published_at * 1000).toISOString() : undefined} className="col-span-2 flex items-center gap-2 text-xs font-medium text-muted-foreground sm:col-span-1 sm:items-start sm:pt-1"><span className="size-1.5 shrink-0 rounded-full bg-primary" />{formatDate(item.published_at) || "Friss"}</time>
            <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase text-primary">{item.category}</span><Coverage item={item} />{item.is_synthesized && <span className="text-[10px] font-medium text-muted-foreground">✨ AI összesített</span>}</div><h2 className="font-display text-base font-bold leading-snug transition-colors group-hover:text-primary sm:text-xl"><RichText text={item.title} /></h2>{item.lead && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground"><RichText text={item.lead} /></p>}<p className="mt-3 text-[10px] text-muted-foreground">{item.sources.slice(0, 3).map(s => s.source).join(" · ")}</p></div>
            {!item.is_synthesized && item.sources[0]?.link && <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" />}
          </StoryLink>
        </li>)}
      </ol>}
      {!list.length && <p className="py-16 text-center text-sm text-muted-foreground">Nincs találat.</p>}
      {view === "latest" && list.length > limit && <div className="mt-8 flex justify-center"><Button variant="outline" size="default" onClick={() => setLimit(n => n + 60)}>További hírek</Button></div>}
      {view === "top" && <div className="mt-10 flex justify-end border-t border-border pt-6"><Link to="/friss" className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}><Clock3 className="size-4" />Friss hírek →</Link></div>}
    </main>
    <footer className="border-t border-border py-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-muted-foreground"><span>© 2026 HIREKX.hu</span><Link to="/forrasok" className="hover:text-primary">Források</Link></div></footer>
  </div>;
}