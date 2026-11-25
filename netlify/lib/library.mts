// Pino's library: public-domain books (Project Gutenberg texts, published 1812-1913,
// authors long deceased). Built by scripts/make_books.py.
// gift: not on his shelf until a visitor gives it. art: a drawing manual he learns from.

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
import blackboard_drawing from "../../public/books/blackboard-drawing.json" with { type: "json" };
import elements_of_drawing from "../../public/books/elements-of-drawing.json" with { type: "json" };
import practice_of_drawing from "../../public/books/practice-of-drawing.json" with { type: "json" };

export type Book = { slug: string; title: string; author: string; year: number; pages: string[]; gift: boolean; art: boolean };

export const BOOKS: Record<string, Book> = {
  "peter-rabbit": { ...(peter_rabbit as Omit<Book, "gift" | "art">), gift: false, art: false },
  "benjamin-bunny": { ...(benjamin_bunny as Omit<Book, "gift" | "art">), gift: false, art: false },
  "jemima-puddle-duck": { ...(jemima_puddle_duck as Omit<Book, "gift" | "art">), gift: false, art: false },
  "velveteen-rabbit": { ...(velveteen_rabbit as Omit<Book, "gift" | "art">), gift: false, art: false },
  "alice": { ...(alice as Omit<Book, "gift" | "art">), gift: false, art: false },
  "wind-in-the-willows": { ...(wind_in_the_willows as Omit<Book, "gift" | "art">), gift: false, art: false },
  "wizard-of-oz": { ...(wizard_of_oz as Omit<Book, "gift" | "art">), gift: false, art: false },
  "andersen": { ...(andersen as Omit<Book, "gift" | "art">), gift: false, art: false },
  "grimm": { ...(grimm as Omit<Book, "gift" | "art">), gift: false, art: false },
  "secret-garden": { ...(secret_garden as Omit<Book, "gift" | "art">), gift: false, art: false },
  "pinocchio": { ...(pinocchio as Omit<Book, "gift" | "art">), gift: true, art: false },
  "railway-children": { ...(railway_children as Omit<Book, "gift" | "art">), gift: true, art: false },
  "anne-of-green-gables": { ...(anne_of_green_gables as Omit<Book, "gift" | "art">), gift: true, art: false },
  "heidi": { ...(heidi as Omit<Book, "gift" | "art">), gift: true, art: false },
  "black-beauty": { ...(black_beauty as Omit<Book, "gift" | "art">), gift: true, art: false },
  "looking-glass": { ...(looking_glass as Omit<Book, "gift" | "art">), gift: true, art: false },
  "princess-and-goblin": { ...(princess_and_goblin as Omit<Book, "gift" | "art">), gift: true, art: false },
  "happy-prince": { ...(happy_prince as Omit<Book, "gift" | "art">), gift: true, art: false },
  "jungle-book": { ...(jungle_book as Omit<Book, "gift" | "art">), gift: true, art: false },
  "tom-kitten": { ...(tom_kitten as Omit<Book, "gift" | "art">), gift: true, art: false },
  "miss-moppet": { ...(miss_moppet as Omit<Book, "gift" | "art">), gift: true, art: false },
  "blackboard-drawing": { ...(blackboard_drawing as Omit<Book, "gift" | "art">), gift: true, art: true },
  "elements-of-drawing": { ...(elements_of_drawing as Omit<Book, "gift" | "art">), gift: true, art: true },
  "practice-of-drawing": { ...(practice_of_drawing as Omit<Book, "gift" | "art">), gift: true, art: true },
};
