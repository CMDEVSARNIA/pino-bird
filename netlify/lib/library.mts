// Pino's library: public-domain children's books (Project Gutenberg texts,
// pre-1929, authors long deceased). Built by make_books.py into public/books.
// The page can also fetch /books/<slug>.json to show what he read.

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

export type Book = { slug: string; title: string; author: string; year: number; pages: string[] };

export const BOOKS: Record<string, Book> = {
  "peter-rabbit": peter_rabbit as Book,
  "benjamin-bunny": benjamin_bunny as Book,
  "jemima-puddle-duck": jemima_puddle_duck as Book,
  "velveteen-rabbit": velveteen_rabbit as Book,
  "alice": alice as Book,
  "wind-in-the-willows": wind_in_the_willows as Book,
  "wizard-of-oz": wizard_of_oz as Book,
  "andersen": andersen as Book,
  "grimm": grimm as Book,
  "secret-garden": secret_garden as Book,
};
