// Pino's library: public-domain books (Project Gutenberg texts, published 1820-1916,
// authors long deceased). Built by scripts/make_books.py.
// gift: not on his shelf until a visitor gives it. art: a drawing manual he learns from.
// holiday: emoji of the holiday a holiday book is about ("" for other books).

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
import holidays_happy_days from "../../public/books/holidays-happy-days.json" with { type: "json" };
import christmas_carol from "../../public/books/christmas-carol.json" with { type: "json" };
import night_before_christmas from "../../public/books/night-before-christmas.json" with { type: "json" };
import christmas_every_day from "../../public/books/christmas-every-day.json" with { type: "json" };
import gift_of_the_magi from "../../public/books/gift-of-the-magi.json" with { type: "json" };
import sleepy_hollow from "../../public/books/sleepy-hollow.json" with { type: "json" };
import halloween_merryvale from "../../public/books/halloween-merryvale.json" with { type: "json" };
import old_fashioned_thanksgiving from "../../public/books/old-fashioned-thanksgiving.json" with { type: "json" };
import emerald_story_book from "../../public/books/emerald-story-book.json" with { type: "json" };
import first_easter from "../../public/books/first-easter.json" with { type: "json" };

export type Book = { slug: string; title: string; author: string; year: number; pages: string[]; gift: boolean; art: boolean; holiday: string };

type Raw = Omit<Book, "gift" | "art" | "holiday">;

export const BOOKS: Record<string, Book> = {
  "peter-rabbit": { ...(peter_rabbit as Raw), gift: false, art: false, holiday: "" },
  "benjamin-bunny": { ...(benjamin_bunny as Raw), gift: false, art: false, holiday: "" },
  "jemima-puddle-duck": { ...(jemima_puddle_duck as Raw), gift: false, art: false, holiday: "" },
  "velveteen-rabbit": { ...(velveteen_rabbit as Raw), gift: false, art: false, holiday: "" },
  "alice": { ...(alice as Raw), gift: false, art: false, holiday: "" },
  "wind-in-the-willows": { ...(wind_in_the_willows as Raw), gift: false, art: false, holiday: "" },
  "wizard-of-oz": { ...(wizard_of_oz as Raw), gift: false, art: false, holiday: "" },
  "andersen": { ...(andersen as Raw), gift: false, art: false, holiday: "" },
  "grimm": { ...(grimm as Raw), gift: false, art: false, holiday: "" },
  "secret-garden": { ...(secret_garden as Raw), gift: false, art: false, holiday: "" },
  "pinocchio": { ...(pinocchio as Raw), gift: true, art: false, holiday: "" },
  "railway-children": { ...(railway_children as Raw), gift: true, art: false, holiday: "" },
  "anne-of-green-gables": { ...(anne_of_green_gables as Raw), gift: true, art: false, holiday: "" },
  "heidi": { ...(heidi as Raw), gift: true, art: false, holiday: "" },
  "black-beauty": { ...(black_beauty as Raw), gift: true, art: false, holiday: "" },
  "looking-glass": { ...(looking_glass as Raw), gift: true, art: false, holiday: "" },
  "princess-and-goblin": { ...(princess_and_goblin as Raw), gift: true, art: false, holiday: "" },
  "happy-prince": { ...(happy_prince as Raw), gift: true, art: false, holiday: "" },
  "jungle-book": { ...(jungle_book as Raw), gift: true, art: false, holiday: "" },
  "tom-kitten": { ...(tom_kitten as Raw), gift: true, art: false, holiday: "" },
  "miss-moppet": { ...(miss_moppet as Raw), gift: true, art: false, holiday: "" },
  "blackboard-drawing": { ...(blackboard_drawing as Raw), gift: true, art: true, holiday: "" },
  "elements-of-drawing": { ...(elements_of_drawing as Raw), gift: true, art: true, holiday: "" },
  "practice-of-drawing": { ...(practice_of_drawing as Raw), gift: true, art: true, holiday: "" },
  "holidays-happy-days": { ...(holidays_happy_days as Raw), gift: true, art: false, holiday: "🎉" },
  "christmas-carol": { ...(christmas_carol as Raw), gift: true, art: false, holiday: "🎄" },
  "night-before-christmas": { ...(night_before_christmas as Raw), gift: true, art: false, holiday: "🎅" },
  "christmas-every-day": { ...(christmas_every_day as Raw), gift: true, art: false, holiday: "🎁" },
  "gift-of-the-magi": { ...(gift_of_the_magi as Raw), gift: true, art: false, holiday: "⭐" },
  "sleepy-hollow": { ...(sleepy_hollow as Raw), gift: true, art: false, holiday: "🎃" },
  "halloween-merryvale": { ...(halloween_merryvale as Raw), gift: true, art: false, holiday: "🦇" },
  "old-fashioned-thanksgiving": { ...(old_fashioned_thanksgiving as Raw), gift: true, art: false, holiday: "🦃" },
  "emerald-story-book": { ...(emerald_story_book as Raw), gift: true, art: false, holiday: "🐣" },
  "first-easter": { ...(first_easter as Raw), gift: true, art: false, holiday: "✝️" },
};
