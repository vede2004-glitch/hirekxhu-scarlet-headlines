// Stable public gallery paths are served unchanged by Cloudflare.
const gallery = {
  "altalanos": [
    "/galeria/altalanos/business-news-and-digital-tablet-on-wood-surface-2026-09-21-05-36-24-utc.jpg",
    "/galeria/altalanos/business-news-on-mobile-device-with-laptop-nearby-2026-09-21-18-30-23-utc-1.jpg",
    "/galeria/altalanos/business-newspaper-on-tablet-next-to-coffee-cup-2026-09-22-08-07-22-utc-1.jpg",
    "/galeria/altalanos/business-professional-presenting-news-on-digital-t-2026-09-22-09-24-08-utc-1.jpg",
    "/galeria/altalanos/camera-in-television-studio-showing-graphics-and-s-2026-09-21-17-02-13-utc-1.jpg",
    "/galeria/altalanos/global-business-data-network-displayed-behind-wind-2026-09-22-09-27-58-utc-1.jpg",
    "/galeria/altalanos/tablet-coffee-and-newspaper-on-wooden-desk-2026-09-22-03-44-24-utc-1.jpg"
  ],
  "bulvar": [
    "/galeria/bulvar/concert-audience-capturing-performance-on-phones-a-2026-09-23-03-39-12-utc.jpg",
    "/galeria/bulvar/crowd-holding-up-mobile-phones-at-a-concert-2026-09-23-20-52-53-utc-1.jpg",
    "/galeria/bulvar/crowd-watching-a-show-with-bright-stage-lights-2026-09-24-00-26-29-utc-1.jpg",
    "/galeria/bulvar/large-crowd-enjoys-live-concert-performance-2026-09-24-11-32-05-utc-1.jpg",
    "/galeria/bulvar/vintage-microphone-standing-on-stage-with-bokeh-li-2026-09-23-19-27-18-utc-1.jpg",
    "/galeria/bulvar/vintage-microphone-with-bokeh-light-background-2026-09-22-14-48-12-utc-1.jpg"
  ],
  "kultura": [
    "/galeria/kultura/54774-interior-of-hungarian-state-opera-house-bud-2026-09-24-11-52-10-utc.jpg",
    "/galeria/kultura/a-book-shelf-in-the-trinity-college-library-in-dub-2026-09-22-14-15-49-utc-1.jpg",
    "/galeria/kultura/abstract-stage-lighting-with-red-and-white-beams-2026-09-22-19-30-16-utc-1.jpg",
    "/galeria/kultura/audience-attending-conference-event-with-golden-ac-2026-09-22-18-03-32-utc-1.jpg",
    "/galeria/kultura/blue-lights-on-stage-with-smoke-effects-2026-09-25-02-51-43-utc-1.jpg",
    "/galeria/kultura/empty-conference-room-with-tiered-seating-2026-09-22-18-18-18-utc-1.jpg",
    "/galeria/kultura/empty-theater-stage-ready-for-performance-2026-09-23-22-46-07-utc-1.jpg",
    "/galeria/kultura/library-of-the-rijksmuseum-amsterdam-2026-09-22-22-18-14-utc-1.jpg"
  ],
  "politika": [
    "/galeria/politika/conference-table-with-multiple-microphones-and-fla-2026-09-24-07-59-43-utc.jpg",
    "/galeria/politika/european-parliament-building-in-brussels-2026-09-22-01-10-30-utc-1.jpg",
    "/galeria/politika/panel-microphones-before-a-corporate-town-hall-mee-2026-09-23-12-40-01-utc-1.jpg",
    "/galeria/politika/podium-microphones-overlooking-cityscape-2026-09-22-19-31-10-utc-1.jpg"
  ],
  "sport": [
    "/galeria/sport/aerial-view-of-people-playing-on-green-field-2026-09-22-22-48-18-utc.jpg",
    "/galeria/sport/athlete-leans-over-goal-post-on-green-field-2026-09-23-12-39-57-utc-1.jpg",
    "/galeria/sport/chain-netting-on-urban-basketball-hoop-outdoors-2026-09-23-13-14-46-utc-1.jpg",
    "/galeria/sport/crowd-in-illuminated-stadium-over-green-sports-fie-2026-09-24-14-49-27-utc-1.jpg",
    "/galeria/sport/empty-stadium-interior-with-yellow-and-blue-seatin-2026-09-22-14-37-17-utc-1.jpg",
    "/galeria/sport/graphic-design-of-green-and-red-basketball-court-2026-09-22-14-09-58-utc-1.jpg",
    "/galeria/sport/men-playing-soccer-on-a-sunny-field-2026-09-22-03-36-24-utc-1.jpg",
    "/galeria/sport/soccer-players-kicking-ball-on-field-at-night-2026-09-25-02-33-15-utc-1.jpg",
    "/galeria/sport/soccer-players-practice-together-on-field-2026-09-22-05-31-37-utc-1.jpg"
  ]
};

export const CATEGORY_COVERS: Record<string, readonly string[]> = {
  "Politika": gallery.politika,
  "Sport": gallery.sport,
  "Kultúra": gallery.kultura,
  "Bulvár": gallery.bulvar,
  "Általános": gallery.altalanos,
  "Gazdaság": gallery.altalanos.filter((url) => /business|global/.test(url)),
};

export function heroPhoto(category: string, text: string, id = text): string {
  const pool = CATEGORY_COVERS[category] ?? gallery.altalanos;
  // Explicit place matches only use gallery images of that place.
  const topic = /európai unió|európai bizottság|brüsszel|uniós|\bEU\b/i.test(text)
    ? gallery.politika.filter((url) => url.includes("european-parliament"))
    : /opera/i.test(text)
      ? gallery.kultura.filter((url) => url.includes("hungarian-state-opera"))
      : [];
  const candidates = topic.length ? topic : pool;
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return candidates[Math.abs(hash) % candidates.length] ?? gallery.altalanos[0] ?? "";
}
