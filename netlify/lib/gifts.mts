// Things visitors can give Pino. Each gift exists once: when someone gives it,
// it's gone from the Give tab for everyone and becomes part of Pino's world.
import { BOOKS } from "./library.mts";
import { SONGS } from "./music.mts";

type Fx = { food?: number; energy?: number; joy?: number; kind?: "journal" | "drawing" };
export type Gift = {
  id: string;
  kind: "book" | "artbook" | "holiday" | "treat" | "snack" | "thing" | "song" | "toy" | "seedpack" | "outfit";
  price: number;       // in seeds
  name: string;        // "a telescope"
  emoji: string;
  desc: string;        // shown on the Give tab
  effects?: Fx;        // treats: eaten straight away
  place?: string;      // snacks & things: where the new activity lives
  activity?: string;   // the new thing he can do there
  fx?: Fx;             // what that activity does for him
  book?: string;       // books: slug
  song?: string;       // songs: id
};
export const PRICES = { treat: 10, song: 20, snack: 25, book: 30, holiday: 30, artbook: 40, toy: 0, seedpack: 12, outfit: 35, thing: 50 } as const;
export const QUICK_TREAT_PRICE = 2;

const TREATS: Omit<Gift, "price">[] = [
  { id: "treat-muffin", kind: "treat", name: "a warm blueberry muffin", emoji: "🫐", desc: "Still warm. Crumbly on top.", effects: { food: 30, joy: 8 } },
  { id: "treat-apple", kind: "treat", name: "a shiny red apple", emoji: "🍎", desc: "Polished until it gleams.", effects: { food: 20, joy: 5 } },
  { id: "treat-seeds", kind: "treat", name: "a bag of sunflower seeds", emoji: "🌻", desc: "Salty, crunchy, very peckable.", effects: { food: 18, joy: 6 } },
  { id: "treat-cake", kind: "treat", name: "a slice of birthday cake", emoji: "🎂", desc: "With a candle. It doesn't have to be his birthday.", effects: { food: 25, joy: 15 } },
  { id: "treat-cocoa", kind: "treat", name: "a mug of hot cocoa", emoji: "☕", desc: "With tiny marshmallows.", effects: { food: 10, energy: 6, joy: 10 } },
  { id: "treat-worms", kind: "treat", name: "a bowl of juicy worms", emoji: "🪱", desc: "A kiwi's favourite. Wriggly.", effects: { food: 35, joy: 7 } },
];

const SNACKS: Omit<Gift, "price">[] = [
  { id: "snack-cookies", kind: "snack", name: "honey oat cookies for the vending machine", emoji: "🍪", desc: "Adds a new button to the vending machine, forever.", place: "vending", activity: "get some honey oat cookies", fx: { food: 26, joy: 6 } },
  { id: "snack-smoothie", kind: "snack", name: "mango smoothies for the vending machine", emoji: "🥭", desc: "Adds a new button to the vending machine, forever.", place: "vending", activity: "get a mango smoothie", fx: { food: 14, energy: 10, joy: 5 } },
  { id: "snack-beetles", kind: "snack", name: "beetle bites for the vending machine", emoji: "🪲", desc: "Crunchy protein. Kiwis love them.", place: "vending", activity: "get a pack of beetle bites", fx: { food: 28, joy: 4 } },
  { id: "snack-cheese", kind: "snack", name: "cheese puffs for the vending machine", emoji: "🧀", desc: "Leaves orange dust on his beak.", place: "vending", activity: "get a bag of cheese puffs", fx: { food: 20, joy: 8 } },
  { id: "snack-seaweed", kind: "snack", name: "seaweed snacks for the vending machine", emoji: "🌿", desc: "Salty and papery.", place: "vending", activity: "get some seaweed snacks", fx: { food: 16, energy: 4, joy: 3 } },
  { id: "snack-milk", kind: "snack", name: "strawberry milk for the vending machine", emoji: "🍓", desc: "Pink and very sweet.", place: "vending", activity: "get a strawberry milk", fx: { food: 15, energy: 5, joy: 7 } },
];

const THINGS: Omit<Gift, "price">[] = [
  { id: "thing-telescope", kind: "thing", name: "a telescope", emoji: "🔭", desc: "Set up beside his house, pointed at the sky.", place: "house", activity: "look at the sky through my telescope", fx: { joy: 12, energy: -2 } },
  { id: "thing-train", kind: "thing", name: "a toy train set", emoji: "🚂", desc: "A little train that goes round a track in the park.", place: "park", activity: "play with my toy train", fx: { joy: 14, energy: -6, food: -2 } },
  { id: "thing-birdbath", kind: "thing", name: "a birdbath", emoji: "🛁", desc: "A stone birdbath for the park.", place: "park", activity: "splash in the birdbath", fx: { joy: 10, energy: -4, food: -2 } },
  { id: "thing-kite", kind: "thing", name: "a kite", emoji: "🪁", desc: "A red kite with a long tail.", place: "park", activity: "fly my kite", fx: { joy: 13, energy: -8, food: -3 } },
  { id: "thing-paints", kind: "thing", name: "a set of watercolour paints", emoji: "🎨", desc: "For the drawing table at the library.", place: "library", activity: "paint with watercolours", fx: { joy: 12, energy: -5, kind: "drawing" } },
  { id: "thing-blanket", kind: "thing", name: "a cosy knitted blanket", emoji: "🧶", desc: "For curling up at home.", place: "house", activity: "curl up in my cosy blanket", fx: { energy: 8, joy: 6 } },
];

const BOOK_GIFTS: Gift[] = Object.values(BOOKS).filter((b) => b.gift).map((b) => ({
  id: `book-${b.slug}`, kind: b.art ? "artbook" : b.holiday ? "holiday" : "book",
  name: `the ${b.art ? "art book" : b.holiday ? "holiday book" : "book"} "${b.title}"`, emoji: b.art ? "🖌️" : b.holiday || "📕",
  price: b.art ? PRICES.artbook : b.holiday ? PRICES.holiday : PRICES.book,
  desc: b.art ? `${b.title} by ${b.author} (${b.year}). A drawing manual: Pino studies it and his drawings improve.`
              : `${b.title} by ${b.author} (${b.year}). Goes on his library shelf.`, book: b.slug,
}));

const SONG_GIFTS: Gift[] = SONGS.filter((s) => s.gift).map((s) => ({
  id: `song-${s.id}`, kind: "song", name: `the record "${s.title}"`, emoji: "💿", price: PRICES.song,
  desc: `${s.title} by ${s.by}. A new record for his gramophone.`, song: s.id,
}));

// Toys he can carry around: he picks them up, hugs them and puts them down wherever he likes
export const TEDDY_ID = "toy-penguin";
const TOYS: Omit<Gift, "price">[] = [
  { id: TEDDY_ID, kind: "toy", name: "a penguin teddy", emoji: "🐧", desc: "A soft little penguin to cuddle. Pino can pick it up and carry it anywhere. Free!" },
];

// Seed packets for his garden: these never run out - visitors can buy him as many as they like
import { CROPS } from "./garden.mts";
const SEEDPACKS: Omit<Gift, "price">[] = Object.values(CROPS).map((c) => ({
  id: `seeds-${c.id}`, kind: "seedpack" as const, name: `a packet of ${c.name} seeds`, emoji: c.emoji,
  desc: `Pino plants them in his garden by the house. ${c.flower ? "They bloom" : "They're ready to eat"} after about ${c.hours / 24 === Math.round(c.hours / 24) ? `${c.hours / 24} day${c.hours === 24 ? "" : "s"}` : `${c.hours} hours`} of growing, if he keeps them watered.`,
}));
export const repeatable = (g: { kind: string }) => g.kind === "seedpack";

// Things to wear: he puts them on when the weather suits them
const OUTFITS: Omit<Gift, "price">[] = [
  { id: "outfit-bowtie", kind: "outfit", name: "a dapper bow tie", emoji: "🎀", desc: "A smart little bow tie. Pino wears it every day." },
  { id: "outfit-sunhat", kind: "outfit", name: "a straw sun hat", emoji: "👒", desc: "For warm, sunny days in the park. (In winter it waits in his cupboard.)" },
  { id: "outfit-boots", kind: "outfit", name: "yellow rain boots", emoji: "🥾", desc: "Tiny yellow boots for splashing through rain and snow." },
];

export const GIFTS: Gift[] = ([...TOYS, ...OUTFITS, ...SEEDPACKS, ...BOOK_GIFTS, ...SONG_GIFTS, ...TREATS, ...SNACKS, ...THINGS] as (Omit<Gift, "price"> & { price?: number })[])
  .map((g) => ({ ...g, price: g.price ?? PRICES[g.kind] }));
export const GIFT_BY_ID: Record<string, Gift> = Object.fromEntries(GIFTS.map((g) => [g.id, g]));
