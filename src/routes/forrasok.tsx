import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, GitMerge, Link2, Rss, Sparkles } from "lucide-react";
import { PageShell, glass, meta } from "@/components/PageShell";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/forrasok")({
  head: () => meta("Forrásaink & Átláthatóság – HIREKX.hu", "A HIREKX.hu által figyelt magyar hírforrások, és hogyan készülnek az AI-összesített hírek."),
  component: Sources,
});

const SOURCES: [string, string, string][] = [
  ["Index", "https://index.hu", "Hírek"], ["Telex", "https://telex.hu", "Hírek"], ["24.hu", "https://24.hu", "Hírek"],
  ["HVG", "https://hvg.hu", "Hírek"], ["444", "https://444.hu", "Hírek"], ["Híradó.hu (MTI)", "https://hirado.hu", "Hírek"],
  ["Magyar Nemzet", "https://magyarnemzet.hu", "Hírek"], ["Mandiner", "https://mandiner.hu", "Hírek"], ["ATV", "https://www.atv.hu", "Hírek"],
  ["Magyar Narancs", "https://magyarnarancs.hu", "Hírek"], ["Szeretlek Magyarország", "https://www.szeretlekmagyarorszag.hu", "Hírek"],
  ["Vadhajtások", "https://www.vadhajtasok.hu", "Hírek"], ["Magyar Jelen", "https://magyarjelen.hu", "Hírek"], ["Konfront", "https://konfront.hu", "Hírek"],
  ["Origo", "https://www.origo.hu", "Hírek"], ["Portfolio", "https://www.portfolio.hu", "Gazdaság"], ["Világgazdaság", "https://www.vg.hu", "Gazdaság"],
  ["Nemzeti Sport", "https://www.nemzetisport.hu", "Sport"], ["M4 Sport", "https://m4sport.hu", "Sport"],
  ["HWSW", "https://www.hwsw.hu", "Tech"], ["Prohardver", "https://prohardver.hu", "Tech"], ["Rakéta.hu", "https://raketa.hu", "Tech"], ["PC World", "https://pcworld.hu", "Tech"],
  ["Blikk", "https://www.blikk.hu", "Bulvár"], ["Femina", "https://femina.hu", "Életmód"], ["Nők Lapja Café", "https://nlc.hu", "Életmód"],
];

function Sources() {
  const ro = useLang() === "ro";
  const steps = ro
    ? [[Rss, "Colectare", "Citim fluxurile RSS ale surselor de mai jos."], [GitMerge, "Grupare", "Articolele despre același eveniment sunt grupate."], [Sparkles, "Sinteză AI", "AI scrie un rezumat neutru din mai multe surse."], [Link2, "Atribuire", "Fiecare știre listează și leagă sursele originale."]]
    : [[Rss, "Gyűjtés", "Az alábbi források RSS-csatornáit olvassuk."], [GitMerge, "Csoportosítás", "Az ugyanarról szóló cikkeket összekapcsoljuk."], [Sparkles, "AI összefoglaló", "Az AI több forrásból semleges összefoglalót ír."], [Link2, "Hivatkozás", "Minden hír végén ott vannak az eredeti források linkjei."]];
  return (
    <PageShell eyebrow={ro ? "Surse & Transparență" : "Forrásaink & Átláthatóság"} title={ro ? "De unde vin știrile noastre" : "Honnan jönnek a híreink"} intro={ro ? "Nu modificăm atribuirea surselor: fiecare articol trimite la publicația originală." : "A források megjelölését soha nem változtatjuk meg: minden hír az eredeti kiadványhoz vezet."}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(([I, t, d], i) => { const Icon = I as typeof Rss; return (
          <div key={t as string} className={glass}><div className="flex items-center justify-between"><Icon className="size-6 text-primary" /><span className="font-display text-3xl font-bold text-muted-foreground/40">0{i + 1}</span></div><h3 className="mt-4 font-display font-bold">{t as string}</h3><p className="mt-2 text-sm text-muted-foreground">{d as string}</p></div>
        ); })}
      </div>
      <h2 className="mt-14 font-display text-2xl font-bold">{ro ? "Surse integrate" : "Figyelt források"}</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SOURCES.map(([name, url, l]) => (
          <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card/70 p-5 text-center transition-colors hover:border-primary/50">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 font-display text-lg font-bold text-primary">{name.slice(0, 2)}</span>
            <span className="text-sm font-bold group-hover:text-primary">{name}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">{l} <ExternalLink className="size-3" /></span>
          </a>
        ))}
      </div>
    </PageShell>
  );
}
