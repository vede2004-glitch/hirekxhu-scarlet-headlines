import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { newsByTag, tagLabel, tagSlug, timeAgo } from "@/lib/news";
import { plainBold } from "@/components/RichText";
import { newsSlug } from "@/lib/news-slug";
import { SITE_URL } from "@/lib/article-schema";

export const Route = createFileRoute("/tag/$tagName")({
  loader: ({ params }) => {
    const tag = tagSlug(decodeURIComponent(params.tagName));
    return { tag, items: newsByTag(tag) };
  },
  head: ({ loaderData, params }) => {
    const label = tagLabel(loaderData?.tag ?? params.tagName);
    const title = `${label} - Legfrissebb hírek és fejlemények egy helyen | HírekX`;
    const desc = `Az összes HIREKX.hu cikk a(z) ${label} témában, időrendben.`;
    const url = `${SITE_URL}/tag/${encodeURIComponent(loaderData?.tag ?? params.tagName)}`;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" }, { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData?.items.length ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: TagPage,
});

function TagPage() {
  const { tag, items } = Route.useLoaderData();
  return (
    <PageShell eyebrow="Címke" title={`Címke: ${tagLabel(tag)}`} intro={`${items.length} cikk ebben a témában`}>
      {items.length === 0 ? (
        <p className="text-center text-muted-foreground">Ehhez a címkéhez még nincs cikk.</p>
      ) : (
        <ul className="mx-auto max-w-3xl divide-y divide-border">
          {items.map((n) => (
            <li key={n.group_id} className="py-5">
              {(() => {
                const body = <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{n.category} · <span className="text-muted-foreground">{timeAgo(n.published_at)}</span></p>
                <h2 className="mt-1 font-display text-lg font-bold leading-snug group-hover:text-primary">{plainBold(n.title)}</h2>
                {n.lead && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{plainBold(n.lead)}</p>}
                </>;
                const ext = !n.is_synthesized && n.sources[0]?.link;
                return ext
                  ? <a href={ext} target="_blank" rel="noopener noreferrer" className="group block">{body}</a>
                  : <Link to="/hir/$id" params={{ id: newsSlug(n) }} className="group block">{body}</Link>;
              })()}
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
