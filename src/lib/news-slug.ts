export function newsSlug(item: { title: string; published_at?: number | null }): string {
  const title = item.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "hir";
  const date = item.published_at ? new Date(item.published_at * 1000) : null;
  const suffix = date && Number.isFinite(date.getTime())
    ? date.toISOString().slice(0, 19).replace(/[T:]/g, "-") : "";
  return suffix ? `${title}-${suffix}` : title;
}