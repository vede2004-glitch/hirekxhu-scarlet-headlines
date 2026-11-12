import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Link, useLoaderData } from "@tanstack/react-router";
import { Clock3, Flame, Layers3, Search, Radio, X, Library } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteMenu } from "@/components/SiteMenu";
import { RichText } from "@/components/RichText";
import { Button, buttonVariants } from "@/components/ui/button";
import { news, normalizeNewsList, CATEGORIES, ALL, formatDate, type NewsItem } from "@/lib/news";
import { splitNewsFeed } from "@/lib/news-feed";
import { heroPhoto } from "@/lib/news-covers";
import { useNewsVersion } from "@/lib/news-live";
import { cn } from "@/lib/utils";

function Coverage({ item }: { item: NewsItem }) {
  return item.sources.length > 1 ? <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground"><Layers3 className="size-3" />{item.sources.length} forrás</span> : null;
}

function StoryLink({ item, className, children }: { item: NewsItem; className: string; children: ReactNode }) {
  const source = item.sources[0];
  return !item.is_synthesized && source?.link
    ? <a href={source.link} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    : <Link to="/hir/$id" params={{ id: item.slug || item.group_id }} className={className}>{children}</Link>;
}

const subscribeHydration = () => () => {};
const clientHydration = () => true;
const serverHydration = () => false;

export function NewsFeed({ view }: { view: "top" | "latest" | "singles" }) {
  const version = useNewsVersion();
  const { liveNews } = useLoaderData({ from: "__root__" });
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydration, serverHydration);
  const [query, setQuery] = useState("");
  const [mobileSearch, setMobileSearch] = useState(false);
  const [category, setCategory] = useState<string>(ALL);
  const [limit, setLimit] = useState(60);
  const feed = useMemo(() => {
    // Initial browser render uses the exact request snapshot, not shared mutable news.
    if (!hydrated && liveNews) {
      try { return splitNewsFeed(normalizeNewsList(JSON.parse(liveNews))); } catch { /* bundled fallback */ }
    }
    return splitNewsFeed(news);
  }, [version, hydrated, liveNews]);
  const list = useMemo(() => (view === "top" ? feed.top : view === "latest" ? feed.latest : feed.singles).filter(item =>
    (category === ALL || item.category === category) &&
    `${item.title} ${item.lead}`.toLocaleLowerCase("hu").includes(query.toLocaleLowerCase("hu"))
  ), [feed, view, category, query]);

  const matches = (item: NewsItem) => (category === ALL || item.category === category) &&
    `${item.title} ${item.lead}`.toLocaleLowerCase("hu").includes(query.toLocaleLowerCase("hu"));
  const sidebar = feed.singles.filter(matches).slice(0, 25);
  // Duplication guard: the hero story is shown once, at the top of the Top view,
  // and never inside the feed below. The Fresh view leads with its newest item instead.
  const hero = view === "top" && feed.hero && matches(feed.hero) ? feed.hero : null;
  const [lead, side1, side2, ...rest] = hero ? [hero, ...list] : list;
  const count = list.length + (hero ? 1 : 0);
  const title = view === "top" ? "Top hírek" : view === "latest" ? "Friss hírek" : "Hírfolyam";

  const timeline = (items: NewsItem[]) => <ol className="space-y-5 border-l border-border pl-4">
    {items.map(item => <li key={item.group_id} data-news-id={item.group_id} className="relative">
      <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary/60" />
      <StoryLink item={item} className="group block">
        <time className="text-[10px] font-bold uppercase text-muted-foreground">{formatDate(item.published_at)} · {item.sources[0]?.source}</time>
        <h3 className="mt-1 text-sm font-bold leading-snug transition-colors group-hover:text-primary"><RichText text={item.title} /></h3>
      </StoryLink>
    </li>)}
  </ol>;

  return <div className="min-h-screen bg-background font-sans text-foreground">
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-5 md:gap-8">
          <Link to="/" aria-label="HIREKX.hu főoldal"><BrandLogo className="h-10 w-32 object-contain object-left sm:w-40" /></Link>
          <label className="hidden items-center gap-3 rounded-full border border-input bg-secondary px-4 focus-within:border-primary/50 md:flex">
            <span className="size-2 shrink-0 rounded-full bg-primary motion-safe:animate-live" /><span className="sr-only">Keresés a hírek között</span>
            <input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(60); }} placeholder="Keresés hírekre…" className="h-10 w-60 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4"><span className="hidden items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground lg:flex"><span className="size-2 rounded-full bg-primary motion-safe:animate-live" />Minden hír egy helyen</span><Button variant="outline" size="icon" className="md:hidden" aria-label={mobileSearch ? "Kereső bezárása" : "Keresés"} onClick={() => setMobileSearch(value => !value)}>{mobileSearch ? <X className="size-4" /> : <Search className="size-4" />}</Button><SiteMenu /></div>
      </div>
      {mobileSearch && <div className="border-t border-border px-4 py-3 md:hidden"><label className="flex items-center gap-2 rounded-md border border-input bg-secondary px-3"><Search className="size-4 shrink-0 text-muted-foreground" /><span className="sr-only">Keresés a hírek között</span><input type="search" autoFocus value={query} onChange={e => { setQuery(e.target.value); setLimit(60); }} placeholder="Keresés hírekre…" className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label></div>}
    </header>
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-4">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <nav aria-label="Hírkategóriák" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {[ALL, ...CATEGORIES].map(c => <Button key={c} variant={category === c ? "default" : "ghost"} size="sm" aria-pressed={category === c} onClick={() => { setCategory(c); setLimit(60); }} className="whitespace-nowrap">{c}</Button>)}
        </nav>
        <Link to="/osszes" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-2")}><Library className="size-3.5" /><span className="hidden sm:inline">Minden hír (archívum)</span><span className="sm:hidden">Archívum</span></Link>
      </div>
      <div className="mb-5 flex items-center justify-between gap-2 border-b border-border py-2">
        <nav aria-label="Hírnézetek" className="flex min-w-0 gap-1">
          <Link to="/" aria-current={view === "top" ? "page" : undefined} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 px-2 text-xs", view === "top" && "bg-primary/10 text-primary")}><Flame className="size-3.5" />Top hírek</Link>
          <Link to="/friss" aria-current={view === "latest" ? "page" : undefined} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 px-2 text-xs", view === "latest" && "bg-primary/10 text-primary")}><Clock3 className="size-3.5" />Friss hírek</Link>
          <Link to="/hirfolyam" aria-current={view === "singles" ? "page" : undefined} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 px-2 text-xs", view === "singles" && "bg-primary/10 text-primary")}><Radio className="size-3.5" />Hírfolyam</Link>
        </nav>
        <h1 className="sr-only">{title}</h1><span className="shrink-0 text-[10px] text-muted-foreground">{count} hír</span>
      </div>
      {view !== "singles" ? <>
        {lead && <section aria-label="Kiemelt hírek" className="grid grid-cols-12 gap-4 lg:auto-rows-[240px]">
          <article data-news-id={lead.group_id} className="col-span-12 min-w-0 lg:col-span-8 lg:row-span-2">
            <StoryLink item={lead} className="group relative flex h-full min-h-80 flex-col justify-end overflow-hidden rounded-lg border border-primary/25 bg-card transition-colors hover:border-primary/50">
              <img src={heroPhoto(lead.category, `${lead.title} ${lead.lead}`, lead.group_id)} alt="" loading="eager" className="absolute inset-0 size-full object-cover opacity-75 transition-opacity duration-500 group-hover:opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/25" />
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
              <div className="relative p-5 sm:p-8">
                <div className="mb-4 flex flex-wrap items-center gap-3"><span className="rounded-sm border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">{lead.is_synthesized ? "✨ AI összesített hír" : "Kiemelt hír"}</span><span className="text-[10px] font-bold uppercase text-muted-foreground">{lead.category} · {formatDate(lead.published_at)}</span></div>
                <h2 className="max-w-3xl font-display text-3xl font-extrabold leading-tight sm:text-4xl"><RichText text={lead.title} /></h2>
                {lead.lead && <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-relaxed text-foreground/65 sm:text-base"><RichText text={lead.lead} /></p>}
                <p className="mt-5 text-xs font-medium uppercase text-muted-foreground">{lead.sources.length} forrás alapján</p>
              </div>
            </StoryLink>
          </article>
          {[side1, side2].filter((item): item is NewsItem => Boolean(item)).map(item => <article key={item.group_id} data-news-id={item.group_id} className="col-span-12 min-w-0 sm:col-span-6 lg:col-span-4">
            <StoryLink item={item} className="group flex h-full min-h-44 flex-col justify-between rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30">
              <div><p className="mb-3 text-[10px] font-bold uppercase text-primary">✨ AI · {item.category}</p><h2 className="line-clamp-4 font-display text-xl font-bold leading-tight transition-colors group-hover:text-primary"><RichText text={item.title} /></h2></div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-[10px] uppercase text-muted-foreground">{formatDate(item.published_at)}</span><Coverage item={item} /></div>
            </StoryLink>
          </article>)}
        </section>}
        <section className="mt-10 grid grid-cols-12 gap-8">
          <div className={cn("col-span-12", view === "top" && "lg:col-span-8")}>
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-sm font-extrabold uppercase">AI összesített hírek</h2><span className="text-[10px] text-muted-foreground">{list.length} hír</span></div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-9 md:grid-cols-2">
              {rest.map((item, i) => <article key={item.group_id} data-news-id={item.group_id} className="min-w-0">
                <StoryLink item={item} className="group block">
                  <div className="mb-4 flex items-center justify-between border-t-2 border-primary/60 pt-3"><span className="text-[9px] font-bold uppercase text-primary">✨ AI összesített</span><span className="font-display text-2xl font-extrabold text-primary/30">{String(i + 1).padStart(2, "0")}</span></div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase text-muted-foreground"><span>{item.category}</span><span>{formatDate(item.published_at)}</span></div>
                  <h3 className="font-display text-lg font-bold leading-tight transition-colors group-hover:text-primary"><RichText text={item.title} /></h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground"><RichText text={item.lead} /></p>
                  <p className="mt-3 border-t border-border pt-3 text-[10px] font-bold text-primary">{item.sources.length} forrás alapján <span className="font-medium text-muted-foreground">{item.sources.slice(0, 3).map(s => s.source).join(" · ")}</span></p>
                </StoryLink>
              </article>)}
            </div>
            {!list.length && <p className="py-12 text-center text-sm text-muted-foreground">Nincs találat.</p>}
          </div>
          {view === "top" && <aside aria-label="Egyforrású hírek" className="col-span-12 border-t border-border pt-4 lg:col-span-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            <div className="lg:sticky lg:top-24"><h2 className="mb-6 flex items-center justify-between font-display text-sm font-extrabold uppercase"><Link to="/hirfolyam" className="hover:text-primary">Hírfolyam →</Link><span className="flex items-center gap-2 text-[10px] text-muted-foreground"><span className="size-2 rounded-full bg-primary motion-safe:animate-live" />Élő</span></h2>
              <div className="max-h-[60vh] overflow-y-auto pl-1">{timeline(sidebar)}{!sidebar.length && <p className="text-xs text-muted-foreground">Nincs találat.</p>}</div>
            </div>
          </aside>}
        </section>
      </> : <section aria-label="Hírfolyam időrendben" className="max-w-4xl py-3">
        {timeline(list.slice(0, limit))}
        {!list.length && <p className="py-12 text-center text-sm text-muted-foreground">Nincs találat.</p>}
        {list.length > limit && <div className="mt-8 flex justify-center"><Button variant="outline" onClick={() => setLimit(n => n + 60)}>További hírek</Button></div>}
      </section>}
    </main>
    <footer className="mt-16 border-t border-border py-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-muted-foreground"><BrandLogo className="h-10 w-40 object-contain" /><span>© 2026 HIREKX.hu · Minden hír egy helyen</span><Link to="/forrasok" className="hover:text-primary">Források</Link></div></footer>
  </div>;
}
