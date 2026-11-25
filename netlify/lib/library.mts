// Pino's library: public-domain children's books (Project Gutenberg texts,
// published 1812-1908, authors long deceased). Built by scripts/make_books.py.
// Books marked gift aren't on his shelf until a visitor gives them to him.

import peter_rabbit from "../../public/books/peter-rabbit.json" with { type: "json" };
import benjamin_bunny from "../../public/books/benjamin-bunny.json" with { type: "json" };
import jemima_puddle_duck from "../../public/books/jemima-puddle-duck.json" with { type: "json" };
import velveteen_rabbit from "../../public/books/velveteen-rabbit.json" with { type: "json" };
import alice from "../../public/books/alice.json" with { type: "json" };
import wind_in_the_willows from "../../public/books/wind-in-the-willows.json" with { type: "json" };
import wizard_of_oz from "../../public/books/wizard-of-oz.json" with { type: "json" };
import andersen from "../../public/books/andersen.json" with { type: "json" };
import grimm from "../../public/books/grimm.json" with { type: "json" };
import secret_garden from "../../public/books/secret-garden.json" with { type: "json" };
import pinocchio from "../../public/books/pinocchio.json" with { type: "json" };
import railway_children from "../../public/books/railway-children.json" with { type: "json" };
import anne_of_green_gables from "../../public/books/anne-of-green-gables.json" with { type: "json" };
import heidi from "../../public/books/heidi.json" with { type: "json" };
import black_beauty from "../../public/books/black-beauty.json" with { type: "json" };
import looking_glass from "../../public/books/looking-glass.json" with { type: "json" };
import princess_and_goblin from "../../public/books/princess-and-goblin.json" with { type: "json" };
import happy_prince from "../../public/books/happy-prince.json" with { type: "json" };
import jungle_book from "../../public/books/jungle-book.json" with { type: "json" };
import tom_kitten from "../../public/books/tom-kitten.json" with { type: "json" };
import miss_moppet from "../../public/books/miss-moppet.json" with { type: "json" };

export type Book = { slug: string; title: string; author: string; year: number; pages: string[]; gift: boolean };

export const BOOKS: Record<string, Book> = {
  "peter-rabbit": { ...(peter_rabbit as Omit<Book, "gift">), gift: false },
  "benjamin-bunny": { ...(benjamin_bunny as Omit<Book, "gift">), gift: false },
  "jemima-puddle-duck": { ...(jemima_puddle_duck as Omit<Book, "gift">), gift: false },
  "velveteen-rabbit": { ...(velveteen_rabbit as Omit<Book, "gift">), gift: false },
  "alice": { ...(alice as Omit<Book, "gift">), gift: false },
  "wind-in-the-willows": { ...(wind_in_the_willows as Omit<Book, "gift">), gift: false },
  "wizard-of-oz": { ...(wizard_of_oz as Omit<Book, "gift">), gift: false },
  "andersen": { ...(andersen as Omit<Book, "gift">), gift: false },
  "grimm": { ...(grimm as Omit<Book, "gift">), gift: false },
  "secret-garden": { ...(secret_garden as Omit<Book, "gift">), gift: false },
  "pinocchio": { ...(pinocchio as Omit<Book, "gift">), gift: true },
  "railway-children": { ...(railway_children as Omit<Book, "gift">), gift: true },
  "anne-of-green-gables": { ...(anne_of_green_gables as Omit<Book, "gift">), gift: true },
  "heidi": { ...(heidi as Omit<Book, "gift">), gift: true },
  "black-beauty": { ...(black_beauty as Omit<Book, "gift">), gift: true },
  "looking-glass": { ...(looking_glass as Omit<Book, "gift">), gift: true },
  "princess-and-goblin": { ...(princess_and_goblin as Omit<Book, "gift">), gift: true },
  "happy-prince": { ...(happy_prince as Omit<Book, "gift">), gift: true },
  "jungle-book": { ...(jungle_book as Omit<Book, "gift">), gift: true },
  "tom-kitten": { ...(tom_kitten as Omit<Book, "gift">), gift: true },
  "miss-moppet": { ...(miss_moppet as Omit<Book, "gift">), gift: true },
};
