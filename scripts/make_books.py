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
# Books visitors can give him (not on his shelf until someone does)
GIFT_BOOKS = [
    (500, "pinocchio", "The Adventures of Pinocchio", "Carlo Collodi", 1883),
    (1874, "railway-children", "The Railway Children", "E. Nesbit", 1906),
    (45, "anne-of-green-gables", "Anne of Green Gables", "L. M. Montgomery", 1908),
    (1448, "heidi", "Heidi", "Johanna Spyri", 1881),
    (271, "black-beauty", "Black Beauty", "Anna Sewell", 1877),
    (12, "looking-glass", "Through the Looking-Glass", "Lewis Carroll", 1871),
    (708, "princess-and-goblin", "The Princess and the Goblin", "George MacDonald", 1872),
    (902, "happy-prince", "The Happy Prince and Other Tales", "Oscar Wilde", 1888),
    (236, "jungle-book", "The Jungle Book", "Rudyard Kipling", 1894),
    (14837, "tom-kitten", "The Tale of Tom Kitten", "Beatrix Potter", 1907),
    (14848, "miss-moppet", "The Story of Miss Moppet", "Beatrix Potter", 1906),
]
# Art instruction books visitors can give him: he learns to draw from them
ART_BOOKS = [
    (32781, "blackboard-drawing", "Blackboard Drawing", "Frederick Whitney", 1908),
    (30325, "elements-of-drawing", "The Elements of Drawing", "John Ruskin", 1857),
    (14264, "practice-of-drawing", "The Practice and Science of Drawing", "Harold Speed", 1913),
]
# Holiday books visitors can give him: (id, slug, title, author, year, emoji of the holiday)
HOLIDAY_BOOKS = [
    (37216, "holidays-happy-days", "Holidays & Happy-Days", "Hamish Hendry", 1901, "🎉"),
    (46, "christmas-carol", "A Christmas Carol", "Charles Dickens", 1843, "🎄"),
    (17135, "night-before-christmas", "A Visit from St. Nicholas", "Clement Clarke Moore", 1823, "🎅"),
    (22519, "christmas-every-day", "Christmas Every Day and Other Stories", "William Dean Howells", 1892, "🎁"),
    (7256, "gift-of-the-magi", "The Gift of the Magi", "O. Henry", 1905, "⭐"),
    (41, "sleepy-hollow", "The Legend of Sleepy Hollow", "Washington Irving", 1820, "🎃"),
    (17145, "halloween-merryvale", "Hallowe'en at Merryvale", "Alice Hale Burnett", 1916, "🦇"),
    (27567, "old-fashioned-thanksgiving", "An Old-Fashioned Thanksgiving", "Louisa May Alcott", 1882, "🦃"),
    (64307, "emerald-story-book", "The Emerald Story Book: Spring and Easter", "Ada M. & Eleanor L. Skinner", 1915, "🐣"),
    (38775, "first-easter", "The First Easter", "J. H. Willard", 1899, "✝️"),
]
HOLIDAY = {b[1]: b[5] for b in HOLIDAY_BOOKS}
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
    "pinocchio": "Once upon a time there was a piece of wood",
    "railway-children": "They were not railway children to begin with",
    "anne-of-green-gables": "Rachel Lynde lived just where the Avonlea main road",
    "heidi": "From the old and pleasantly situated village of Mayenfeld",
    "black-beauty": "The first place that I can well remember",
    "looking-glass": "One thing was certain, that the WHITE kitten",
    "princess-and-goblin": "There was once a little princess whose father was king",
    "happy-prince": "above the city, on a tall column, stood the statue",
    "jungle-book": "It was seven o'clock of a very warm evening in the Seeonee hills",
    "tom-kitten": "Once upon a time there were three little kittens",
    "miss-moppet": "This is a Pussy called Miss Moppet",
    "blackboard-drawing": "Upon entering a schoolroom the teacher finds the blackboards bare",
    "elements-of-drawing": "It may perhaps be thought, that in prefacing a manual of drawing",
    "practice-of-drawing": "Permit me in the first place to anticipate the disappointment",
    "holidays-happy-days": "Little children are usually snug in bed when the first holiday",
    "christmas-carol": "Marley was dead: to begin with",
    "night-before-christmas": "Amid the many celebrations last Christmas Eve",
    "christmas-every-day": "The little girl came into her papa's study",
    "gift-of-the-magi": "One dollar and eighty-seven cents",
    "sleepy-hollow": "In the bosom of one of those spacious coves",
    "halloween-merryvale": "Hallowe'en mean, Father",
    "old-fashioned-thanksgiving": "Sixty years ago, up among the New Hampshire hills",
    "emerald-story-book": "dew-pearled",
    "first-easter": "In the story of The First Easter, as in the story",
}


def clean(text: str) -> str:
    text = text.replace("\r\n", "\n")
    start = re.search(r"\*\*\* ?START OF (THIS|THE) PROJECT GUTENBERG[^\n]*\n", text)
    end = re.search(r"\*\*\* ?END OF (THIS|THE) PROJECT GUTENBERG|End of (the |this )?Project Gutenberg", text[start.end() if start else 0:], re.I)
    body = text[start.end() if start else 0:]
    if end: body = body[:end.start()]
    body = re.sub(r"\|(?=[A-Z])", "", body)  # stray drop-cap markers
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
for gid, slug, title, author, year in BOOKS + GIFT_BOOKS + ART_BOOKS + [b[:5] for b in HOLIDAY_BOOKS]:
    paras = clean((RAW / f"{gid}.txt").read_text(encoding="utf-8", errors="replace"))
    marker = OPENING[slug].lower()
    hit = next((i for i, p in enumerate(paras) if marker in re.sub(r"\s+", " ", p).lower()), None)
    if hit is None: print("!! opening not found for", slug); sys.exit(1)
    paras = paras[hit:]
    if slug in HOLIDAY:  # drop publisher adverts after the last page
        end = next((i for i, p in enumerate(paras) if re.fullmatch(r"THE END\.?", p.strip())), None)
        if end is not None: paras = paras[:end + 1]
    if slug == "velveteen-rabbit" and paras[0].startswith("HERE was"):  # restore the drop-cap letter
        paras[0] = "There was" + paras[0][len("HERE was"):]
    pages = paginate(paras)
    (OUT / f"{slug}.json").write_text(json.dumps({"slug": slug, "title": title, "author": author, "year": year, "pages": pages}, ensure_ascii=False))
    catalog.append({"slug": slug, "title": title, "author": author, "year": year, "pages": len(pages), "gift": (gid, slug, title, author, year) in GIFT_BOOKS + ART_BOOKS or slug in HOLIDAY, "art": (gid, slug, title, author, year) in ART_BOOKS, "holiday": HOLIDAY.get(slug, "")})
    print(f"{title:38} {len(pages):4} pages | first: {pages[0][:70]!r}")
(OUT / "catalog.json").write_text(json.dumps(catalog, indent=1, ensure_ascii=False))
