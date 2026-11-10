import json
import os
import time
import requests
import hashlib
import re
from bs4 import BeautifulSoup
from difflib import SequenceMatcher
from concurrent.futures import ThreadPoolExecutor
from openai import OpenAI

# ==============================================================================
# 1. KONFIGURÁCIÓ
# ==============================================================================
MEMORY_FILE = "hirek_memoria.json"
OUTPUT_FILE = "src/data/news.json"

os.makedirs("src/data", exist_ok=True)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

MODEL_NAME = "gpt-6-luna"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

ALLOWED_CATEGORIES = ["Politika", "Gazdaság", "Sport", "Kultúra", "Bulvár", "Általános"]

POLITICAL_KEYWORDS = [
    "kormány", "parlament", "választás", "párt", "politika", "miniszter", "miniszterelnök", 
    "döntés", "törvény", "fidesz", "kdnp", "dk", "tisza", "momentum", "mi hazánk", 
    "brüsszel", "eu", "orbán", "szijjártó", "magyar péter", "gyurcsány", "ellenzék", 
    "szavazás", "frakció", "országgyűlés", "polgármester", "főpolgármester", "képviselő",
    "parlamenti", "ügyészség", "ötpárti", "politikus", "kabinet", "államtitkár", "voks",
    "demokrata", "republikánus", "trump", "biden", "fehér ház", "kongresszus", "szankció",
    "kína", "háború", "hadsereg", "honvédség", "nato", "putin", "zelenszkij", "ukrajna"
]

# ==============================================================================
# 2. SEGÉDFUNKCIÓK
# ==============================================================================
def slugify(text: str) -> str:
    """Ékezetmentesíti és URL-baráttá alakítja a magyar karaktereket."""
    if not text:
        return ""
    char_map = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ő': 'o', 'ú': 'u', 'ű': 'u', 'ü': 'u',
        'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ő': 'o', 'Ú': 'u', 'Ű': 'u', 'Ü': 'u'
    }
    for orig, repl in char_map.items():
        text = text.replace(orig, repl)
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    return re.sub(r'[\s-]+', '-', text).strip('-')[:50]

def fix_hungarian_names(text: str) -> str:
    """Biztonsági védőháló a leggyakoribb félreírt magyar nevek javítására."""
    if not text:
        return text
    replacements = {
        "Peter Magyar": "Magyar Péter",
        "Péter Magyar": "Magyar Péter",
        "Viktor Orbán": "Orbán Viktor",
    }
    for wrong, correct in replacements.items():
        if wrong in text:
            text = text.replace(wrong, correct)
    return text

def is_political_text(text: str) -> bool:
    """Szigorú ellenőrző a politika kiszűrésére."""
    if not text:
        return False
    text_lower = text.lower()
    return any(re.search(r'\b' + re.escape(kw) + r'\b', text_lower) for kw in POLITICAL_KEYWORDS)

def calculate_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    return SequenceMatcher(None, text1, text2).ratio()

def check_has_new_info_with_ai(existing_summary: str, new_article_text: str) -> bool:
    truncated_new_text = new_article_text[:1200] if new_article_text else ""
    prompt = f"""
MEGLÉVŐ ÖSSZEFOGLALÓ:
{existing_summary}

ÚJ CIKK TARTALMA (RÉSZLET):
{truncated_new_text}

FELADAT:
Tartalmaz az új cikk BÁRMILYEN ÉRDEMI ÚJ TÉNYT, adatot, fejleményt vagy új nyilatkozatot a meglévő összefoglalóhoz képest?
Kizárólag egyetlen szóval válaszolj: "IGEN" vagy "NEM".
"""
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
            temperature=0.0
        )
        answer = response.choices[0].message.content.strip().upper()
        return "IGEN" in answer
    except Exception as e:
        print(f"⚠️ Hiba az AI döntéshozatal során: {e}")
        return True

def calculate_fingerprint(articles_or_sources: list) -> str:
    links = [item.get("link", "") for item in articles_or_sources if item.get("link")]
    sorted_links = sorted(list(set(links)))
    return hashlib.md5("|".join(sorted_links).encode("utf-8")).hexdigest()

def fetch_full_article_text(url: str) -> str:
    if not url:
        return ""
    try:
        response = requests.get(url, headers=HEADERS, timeout=8)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        text_blocks = [p.text.strip() for p in soup.find_all("p") if len(p.text.strip()) > 35]
        return "\n\n".join(text_blocks)[:2000]
    except Exception as e:
        print(f"⚠️ Nem sikerült a cikk letöltése ({url}): {e}")
        return ""

def process_single_article(art: dict) -> dict:
    full_text = fetch_full_article_text(art.get("link", ""))
    content_to_use = full_text if len(full_text) > 120 else art.get("summary", "")
    return {
        "source": art.get("source", ""),
        "title": art.get("title", ""),
        "link": art.get("link", ""),
        "image": art.get("image", ""),
        "content": content_to_use
    }

def load_existing_synthesized_articles() -> dict:
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {item["group_id"]: item for item in data if "group_id" in item}
        except Exception as e:
            print(f"⚠️ Nem sikerült beolvasni a meglévő {OUTPUT_FILE} fájlt: {e}")
    return {}

def prepare_prompt_content(articles: list, existing_synthesized_article: dict = None) -> tuple:
    with ThreadPoolExecutor(max_workers=min(len(articles), 5)) as executor:
        scraped_results = list(executor.map(process_single_article, articles))

    sources_used = [{"source": res["source"], "title": res["title"], "link": res["link"]} for res in scraped_results]
    cover_image = articles[0].get("image", "")
    default_cat = articles[0].get("category", "Általános")

    LEGAL_PARAPHRASE_INSTRUCTION = """
SZIGORÚ SZERZŐI JOGI ÉS FORMÁTUMSZABÁLYOK:
1. TELJES ÁTFOGALMAZÁS: TILOS a forrásszövegekből mondatokat szó szerint átvenni!
2. KIZÁRÓLAG TÉNY-KIVONATOLÁS: Csak a puszta tényeket (dátumok, nevek, számok, események) használd fel.
3. SAJÁT SZAVAK: A cikket 100%-ban teljesen új mondatszerkezetekkel írd meg.
4. CÍMKÉK (TAGS): Generálj 3-5 releváns témacímkét (tags) kisbetűvel, ékezetmentes URL-barát formában (pl. "orban-viktor", "fidesz", "inflacio").
"""

    if existing_synthesized_article and existing_synthesized_article.get("is_synthesized") and not existing_synthesized_article.get("rejected"):
        old_title_hu = existing_synthesized_article.get("title_hu", "")
        old_lead_hu = existing_synthesized_article.get("lead_hu", "")
        old_content_hu = existing_synthesized_article.get("content_hu", "")

        new_sources_text = ""
        for idx, res in enumerate(scraped_results, 1):
            new_sources_text += f"\n--- ÚJ FORRÁS ({res['source']}): {res['title']} ---\n{res['content']}\n"

        prompt = f"""
Te a magyar hírportál vezető szerkesztője vagy. Korábban már írtál egy összefoglalót, de ÚJ források érkeztek.

{LEGAL_PARAPHRASE_INSTRUCTION}

MÁR MEGLÉVŐ ÖSSZEFOGLALÓ:
Cím: {old_title_hu}
Lead: {old_lead_hu}
Tartalom:
{old_content_hu}

ÚJ FORRÁSOK:
{new_sources_text}

FELADAT:
1. Vizsgáld meg az új forrásokat!
2. HA tartalmaz új tényt/adatot, EGÉSZÍTSD KI a gondolatjelekkel (•) kezdődő pontokat!
3. HA nincs benne új információ, állítsd a "skip" mezőt true-ra!
4. Kategóriák: "Politika", "Gazdaság", "Sport", "Kultúra", "Bulvár", "Általános". (Politikai téma esetén KÖTELEZŐ a "Politika").

FORMÁTUMSZABÁLYOK:
- A "content_hu" mezőben KIZÁRÓLAG gondolatjelekkel (•) kezdődő pontokat írj!
- MINDEN PONT ELEJÉN A KULCSÁLLÍTÁST FÉLKÖVÉR MARKDOWN-NAL (**szöveg**) KIEMELD!

JSON SZERKEZET:
{{
  "skip": false,
  "category": "Politika",
  "tags": ["fidesz", "parlament"],
  "title_hu": "Frissített magyar cím",
  "lead_hu": "Frissített 2-3 mondatos lead",
  "content_hu": "• **Dátum vagy Főállítás** első pont...\\n\\n• **Kulcsszó** második pont...",
  "used_sources_indices": [1, 2]
}}
"""
        return prompt, cover_image, sources_used, default_cat

    combined_sources = ""
    for idx, res in enumerate(scraped_results, 1):
        combined_sources += f"\n--- {idx}. FORRÁS: {res['source']} | Cím: {res['title']} ---\n{res['content']}\n"

    prompt = f"""
Te a magyar hírportál vezető szerkesztője vagy. Az alábbiakban megadok több hírforrásból származó cikket egy témacsoportból.

{LEGAL_PARAPHRASE_INSTRUCTION}

FELADAT ÉS SZŰRÉS:
1. Vizsgáld meg a forrásokat! HA BÁRMELYIK NEM UGYANARRÓL AZ ESEMÉNYRŐL SZÓL, AZT HAGYD KI!
2. Ha nem marad legalább 2 összetartozó forrás, állítsd a "skip" mezőt true-ra!
3. Készíts egy összefoglalót MAGYARUL!
4. Kategóriák: "Politika", "Gazdaság", "Sport", "Kultúra", "Bulvár", "Általános". (Politikai téma esetén KÖTELEZŐ a "Politika").

FORMÁTUMSZABÁLYOK:
- A "content_hu" mezőben KIZÁRÓLAG gondolatjelekkel (•) kezdődő pontokat írj!
- MINDEN PONT ELEJÉN A KULCSÁLLÍTÁST FÉLKÖVÉR MARKDOWN-NAL (**szöveg**) KIEMELD!

JSON SZERKEZET:
{{
  "skip": false,
  "category": "Politika",
  "tags": ["orbán-viktor", "eu-csucs"],
  "title_hu": "Magyar cím",
  "lead_hu": "2-3 mondatos lead",
  "content_hu": "• **Dátum vagy Főállítás** első pont...\\n\\n• **Kulcsszó** második pont...",
  "used_sources_indices": [1, 2]
}}

FORRÁSOK:
{combined_sources}
"""
    return prompt, cover_image, sources_used, default_cat

def process_group_direct(g_id: str, articles: list, existing_synthesized: dict, group_fingerprint: str):
    is_update = bool(existing_synthesized and existing_synthesized.get("is_synthesized") and not existing_synthesized.get("rejected"))
    prompt, cover_image, sources_used, default_cat = prepare_prompt_content(articles, existing_synthesized)
    latest_timestamp = max([int(a.get("published_at", a.get("fetched_at", time.time()))) for a in articles])

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "Kizárólag érvényes JSON objektumot adj vissza!"},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content_str = response.choices[0].message.content
        parsed_article = json.loads(content_str)

        if parsed_article.get("skip") is True:
            rejected_entry = {
                "group_id": g_id,
                "fingerprint": group_fingerprint,
                "is_synthesized": False,
                "rejected": True,
                "published_at": latest_timestamp
            }
            return [rejected_entry], False, is_update

        used_indices = parsed_article.get("used_sources_indices", [])
        filtered_sources = [sources_used[i - 1] for i in used_indices if 0 < i <= len(sources_used)] if used_indices else sources_used

        if len(filtered_sources) < 2:
            rejected_entry = {
                "group_id": g_id,
                "fingerprint": group_fingerprint,
                "is_synthesized": False,
                "rejected": True,
                "published_at": latest_timestamp
            }
            return [rejected_entry], False, is_update

        ai_category = parsed_article.get("category", default_cat)
        if ai_category not in ALLOWED_CATEGORIES:
            ai_category = default_cat

        title_hu = fix_hungarian_names(parsed_article.get("title_hu", ""))
        lead_hu = fix_hungarian_names(parsed_article.get("lead_hu", ""))
        content_hu = fix_hungarian_names(parsed_article.get("content_hu", ""))

        full_text_to_check = f"{title_hu} {lead_hu} {content_hu}"
        if is_political_text(full_text_to_check):
            ai_category = "Politika"

        raw_tags = parsed_article.get("tags", [])
        clean_tags = [slugify(t) for t in raw_tags if slugify(t)]
        if not clean_tags:
            clean_tags = [slugify(ai_category)]

        short_id = g_id.replace("group_", "")[:6]
        clean_slug = slugify(title_hu)
        final_slug = f"{clean_slug}-{short_id}" if clean_slug else g_id

        synthesized_entry = {
            "group_id": g_id,
            "slug": final_slug,
            "tags": clean_tags,
            "fingerprint": group_fingerprint,
            "category": ai_category,
            "image": cover_image,
            "is_synthesized": True,
            "rejected": False,
            "sources_count": len(filtered_sources),
            "sources": filtered_sources,
            "published_at": latest_timestamp,
            "title_hu": title_hu,
            "lead_hu": lead_hu,
            "content_hu": content_hu
        }
        return [synthesized_entry], True, is_update

    except Exception as e:
        print(f"⚠️ Hiba a(z) {g_id} feldolgozásakor: {e}")
        return [], False, is_update

# ==============================================================================
# 3. FŐ FOLYAMAT
# ==============================================================================
def run_synthesis_direct():
    print("==================================================================")
    print("🚀 MAGYAR HÍR SZINTETIZÁLÓ FOLYAMAT INDÍTÁSA")
    print("==================================================================")

    if not os.path.exists(MEMORY_FILE):
        print(f"⚠️ A memóriafájl ({MEMORY_FILE}) nem található! Leállás.")
        return

    with open(MEMORY_FILE, "r", encoding="utf-8") as f:
        memory = json.load(f)

    existing_articles = load_existing_synthesized_articles()

    grouped_data = {}
    for item in memory:
        g_id = item.get("group_id")
        if g_id:
            grouped_data.setdefault(g_id, []).append(item)

    multi_groups = []
    single_results = []
    
    CURRENT_TIME = int(time.time())
    AI_PROCESS_CUTOFF = CURRENT_TIME - (12 * 3600)
    RETENTION_CUTOFF = CURRENT_TIME - (24 * 3600)

    for g_id, articles in grouped_data.items():
        latest_timestamp = max([int(a.get("published_at", a.get("fetched_at", 0))) for a in articles])

        if latest_timestamp < RETENTION_CUTOFF:
            continue

        unique_sources = set(art.get("source") for art in articles if art.get("source"))
        if len(unique_sources) < 2:
            art = max(articles, key=lambda a: int(a.get("published_at", a.get("fetched_at", 0))))
            summ = fix_hungarian_names(art.get("summary", "") or "")
            lead = (summ[:200] + "…") if len(summ) > 200 else summ
            title = fix_hungarian_names(art.get("title", ""))
            
            cat = art.get("category", "Általános")
            if is_political_text(f"{title} {summ}"):
                cat = "Politika"

            short_id = g_id.replace("group_", "")[:6]
            clean_slug = slugify(title)
            final_slug = f"{clean_slug}-{short_id}" if clean_slug else g_id

            single_results.append({
                "group_id": g_id,
                "slug": final_slug,
                "tags": [slugify(cat)],
                "category": cat,
                "image": art.get("image"),
                "is_synthesized": False,
                "sources_count": 1,
                "sources": [{"source": art.get("source", ""), "title": art.get("title", ""), "link": art.get("link", "")}],
                "published_at": latest_timestamp,
                "title_hu": title, 
                "lead_hu": lead, 
                "content_hu": summ
            })
            continue

        current_fingerprint = calculate_fingerprint(articles)
        existing_synth = existing_articles.get(g_id)

        if existing_synth and existing_synth.get("is_synthesized"):
            existing_fingerprint = existing_synth.get("fingerprint") or calculate_fingerprint(existing_synth.get("sources", []))

            if existing_fingerprint and current_fingerprint == existing_fingerprint:
                continue

            newest_article = max(articles, key=lambda a: int(a.get("published_at", a.get("fetched_at", 0))))
            new_text = newest_article.get("summary", "") or newest_article.get("title", "")
            existing_summary = existing_synth.get("content_hu", "")
            
            similarity = calculate_similarity(new_text, existing_summary)

            if similarity > 0.85:
                for a in articles:
                    src_entry = {"source": a.get("source", ""), "title": a.get("title", ""), "link": a.get("link", "")}
                    if src_entry not in existing_synth.get("sources", []):
                        existing_synth.setdefault("sources", []).append(src_entry)
                existing_synth["sources_count"] = len(existing_synth["sources"])
                continue

            elif similarity > 0.40:
                has_new_info = check_has_new_info_with_ai(existing_summary, new_text)
                if not has_new_info:
                    for a in articles:
                        src_entry = {"source": a.get("source", ""), "title": a.get("title", ""), "link": a.get("link", "")}
                        if src_entry not in existing_synth.get("sources", []):
                            existing_synth.setdefault("sources", []).append(src_entry)
                    existing_synth["sources_count"] = len(existing_synth["sources"])
                    continue

        if latest_timestamp >= AI_PROCESS_CUTOFF:
            multi_groups.append((g_id, articles, existing_synth, current_fingerprint))

    synthesized_results = []
    if multi_groups:
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [
                executor.submit(process_group_direct, g_id, articles, existing, fingerprint)
                for g_id, articles, existing, fingerprint in multi_groups
            ]
            for future in futures:
                entries, is_synth, is_update = future.result()
                if is_synth:
                    synthesized_results.extend(entries)

    all_final_results = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                for item in json.load(f):
                    if "group_id" in item:
                        all_final_results[item["group_id"]] = item
        except Exception as e:
            print(f"⚠️ Nem sikerült beolvasni a korábbi {OUTPUT_FILE} fájlt: {e}")

    for item in single_results:
        all_final_results[item["group_id"]] = item
    for item in synthesized_results:
        all_final_results[item["group_id"]] = item

    fresh_items = [
        item for item in all_final_results.values() 
        if item.get("published_at", 0) >= RETENTION_CUTOFF and not item.get("rejected")
    ]

    final_sorted_list = sorted(
        fresh_items, 
        key=lambda x: x.get("published_at", 0), 
        reverse=True
    )

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_sorted_list, f, ensure_ascii=False, indent=2)

    print("\n==================================================================")
    print(f"🎉 FOLYAMAT SIKERESEN BEFEJEZŐDÖTT! Mentve: {len(final_sorted_list)} friss cikk.")
    print("==================================================================")

if __name__ == "__main__":
    run_synthesis_direct()
