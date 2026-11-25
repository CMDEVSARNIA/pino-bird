"""Turn Project Gutenberg texts into page-sized JSON books for Pino's library.
Strips the Gutenberg header/footer (allowed by the PG licence once the
trademark text is removed), illustration markers and front matter."""
import json, re, sys
from pathlib import Path

RAW = Path("/home/claude/books-raw")
OUT = Path("/home/claude/pino-bird/public/books")
OUT.mkdir(parents=True, exist_ok=True)

BOOKS = [  # id, slug, title, author, year first published
    (14838, "peter-rabbit", "The Tale of Peter Rabbit", "Beatrix Potter", 1902),
    (14407, "benjamin-bunny", "The Tale of Benjamin Bunny", "Beatrix Potter", 1904),
    (14814, "jemima-puddle-duck", "The Tale of Jemima Puddle-Duck", "Beatrix Potter", 1908),
    (11757, "velveteen-rabbit", "The Velveteen Rabbit", "Margery Williams", 1922),
    (11, "alice", "Alice's Adventures in Wonderland", "Lewis Carroll", 1865),
    (289, "wind-in-the-willows", "The Wind in the Willows", "Kenneth Grahame", 1908),
    (55, "wizard-of-oz", "The Wonderful Wizard of Oz", "L. Frank Baum", 1900),
    (1597, "andersen", "Andersen's Fairy Tales", "Hans Christian Andersen", 1835),
    (2591, "grimm", "Grimms' Fairy Tales", "The Brothers Grimm", 1812),
    (113, "secret-garden", "The Secret Garden", "Frances Hodgson Burnett", 1911),
]
PAGE = 1300  # characters per page
OPENING = {  # where each story really begins (skips contents pages and front matter)
    "peter-rabbit": "upon a time there were four little Rabbits",
    "benjamin-bunny": "One morning a little rabbit sat on a bank",
    "jemima-puddle-duck": "What a funny sight it is to see a brood of ducklings",
    "velveteen-rabbit": "was once a velveteen rabbit, and in the beginning",
    "just-so-stories": "In the sea, once upon a time",
    "alice": "Alice was beginning to get very tired",
    "wind-in-the-willows": "The Mole had been working very hard",
    "wizard-of-oz": "Dorothy lived in the midst of the great Kansas prairies",
    "doctor-dolittle": "Once upon a time, many years ago",
    "andersen": "Many years ago, there was an Emperor",
    "grimm": "A certain king had a beautiful garden",
    "peter-pan": "All children, except one, grow up",
    "secret-garden": "When Mary Lennox was sent to Misselthwaite Manor",
}


def clean(text: str) -> str:
    text = text.replace("\r\n", "\n")
    start = re.search(r"\*\*\* ?START OF (THIS|THE) PROJECT GUTENBERG[^\n]*\n", text)
    end = re.search(r"\*\*\* ?END OF (THIS|THE) PROJECT GUTENBERG", text)
    if not start or not end:
        raise ValueError("markers missing")
    body = text[start.end():end.start()]
    body = re.sub(r"\[Illustration[^\]]*\]", "", body, flags=re.S)
    body = re.sub(r"(?im)^.*(produced by|e-text prepared|transcriber'?s note|html version).*$", "", body)
    body = re.sub(r"[ \t]+", " ", body)
    paras = [re.sub(r"\s*\n\s*", " ", p).strip() for p in re.split(r"\n\s*\n", body)]
    paras = [p for p in paras if p and not re.fullmatch(r"[\W_]+", p)]
    return paras


def paginate(paras):
    pages, cur = [], ""
    for p in paras:
        while len(p) > PAGE * 1.6:  # very long paragraph: split at a sentence
            cut = p.rfind(". ", 0, PAGE) + 1 or PAGE
            pages.append((cur + "\n\n" + p[:cut]).strip()); cur = ""; p = p[cut:].strip()
        if len(cur) + len(p) > PAGE and cur:
            pages.append(cur.strip()); cur = ""
        cur += ("\n\n" if cur else "") + p
    if cur.strip():
        pages.append(cur.strip())
    return pages


catalog = []
for gid, slug, title, author, year in BOOKS:
    paras = clean((RAW / f"{gid}.txt").read_text(encoding="utf-8", errors="replace"))
    marker = OPENING[slug].lower()
    hit = next((i for i, p in enumerate(paras) if marker in re.sub(r"\s+", " ", p).lower()), None)
    if hit is None: print("!! opening not found for", slug); sys.exit(1)
    paras = paras[hit:]
    if slug == "velveteen-rabbit" and paras[0].startswith("HERE was"):  # restore the drop-cap letter
        paras[0] = "There was" + paras[0][len("HERE was"):]
    pages = paginate(paras)
    (OUT / f"{slug}.json").write_text(json.dumps({"slug": slug, "title": title, "author": author, "year": year, "pages": pages}, ensure_ascii=False))
    catalog.append({"slug": slug, "title": title, "author": author, "year": year, "pages": len(pages)})
    print(f"{title:38} {len(pages):4} pages | first: {pages[0][:70]!r}")
(OUT / "catalog.json").write_text(json.dumps(catalog, indent=1, ensure_ascii=False))
