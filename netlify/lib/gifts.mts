// Things visitors can give Pino. Each gift exists once: when someone gives it,
// it's gone from the Give tab for everyone and becomes part of Pino's world.
import { BOOKS } from "./library.mts";

type Fx = { food?: number; energy?: number; joy?: number; kind?: "journal" | "drawing" };
export type Gift = {
  id: string;
  kind: "book" | "treat" | "snack" | "thing";
  name: string;        // "a telescope"
  emoji: string;
  desc: string;        // shown on the Give tab
  effects?: Fx;        // treats: eaten straight away
  place?: string;      // snacks & things: where the new activity lives
  activity?: string;   // the new thing he can do there
  fx?: Fx;             // what that activity does for him
  book?: string;       // books: slug
};

const TREATS: Gift[] = [
  { id: "treat-muffin", kind: "treat", name: "a warm blueberry muffin", emoji: "🫐", desc: "Still warm. Crumbly on top.", effects: { food: 30, joy: 8 } },
  { id: "treat-apple", kind: "treat", name: "a shiny red apple", emoji: "🍎", desc: "Polished until it gleams.", effects: { food: 20, joy: 5 } },
  { id: "treat-seeds", kind: "treat", name: "a bag of sunflower seeds", emoji: "🌻", desc: "Salty, crunchy, very peckable.", effects: { food: 18, joy: 6 } },
  { id: "treat-cake", kind: "treat", name: "a slice of birthday cake", emoji: "🎂", desc: "With a candle. It doesn't have to be his birthday.", effects: { food: 25, joy: 15 } },
  { id: "treat-cocoa", kind: "treat", name: "a mug of hot cocoa", emoji: "☕", desc: "With tiny marshmallows.", effects: { food: 10, energy: 6, joy: 10 } },
  { id: "treat-worms", kind: "treat", name: "a bowl of juicy worms", emoji: "🪱", desc: "A kiwi's favourite. Wriggly.", effects: { food: 35, joy: 7 } },
];

const SNACKS: Gift[] = [
  { id: "snack-cookies", kind: "snack", name: "honey oat cookies for the vending machine", emoji: "🍪", desc: "Adds a new button to the vending machine, forever.", place: "vending", activity: "get some honey oat cookies", fx: { food: 26, joy: 6 } },
  { id: "snack-smoothie", kind: "snack", name: "mango smoothies for the vending machine", emoji: "🥭", desc: "Adds a new button to the vending machine, forever.", place: "vending", activity: "get a mango smoothie", fx: { food: 14, energy: 10, joy: 5 } },
  { id: "snack-beetles", kind: "snack", name: "beetle bites for the vending machine", emoji: "🪲", desc: "Crunchy protein. Kiwis love them.", place: "vending", activity: "get a pack of beetle bites", fx: { food: 28, joy: 4 } },
  { id: "snack-cheese", kind: "snack", name: "cheese puffs for the vending machine", emoji: "🧀", desc: "Leaves orange dust on his beak.", place: "vending", activity: "get a bag of cheese puffs", fx: { food: 20, joy: 8 } },
  { id: "snack-seaweed", kind: "snack", name: "seaweed snacks for the vending machine", emoji: "🌿", desc: "Salty and papery.", place: "vending", activity: "get some seaweed snacks", fx: { food: 16, energy: 4, joy: 3 } },
  { id: "snack-milk", kind: "snack", name: "strawberry milk for the vending machine", emoji: "🍓", desc: "Pink and very sweet.", place: "vending", activity: "get a strawberry milk", fx: { food: 15, energy: 5, joy: 7 } },
];

const THINGS: Gift[] = [
  { id: "thing-telescope", kind: "thing", name: "a telescope", emoji: "🔭", desc: "Set up beside his house, pointed at the sky.", place: "house", activity: "look at the sky through my telescope", fx: { joy: 12, energy: -2 } },
  { id: "thing-train", kind: "thing", name: "a toy train set", emoji: "🚂", desc: "A little train that goes round a track in the park.", place: "park", activity: "play with my toy train", fx: { joy: 14, energy: -6 } },
  { id: "thing-birdbath", kind: "thing", name: "a birdbath", emoji: "🛁", desc: "A stone birdbath for the park.", place: "park", activity: "splash in the birdbath", fx: { joy: 10, energy: -4 } },
  { id: "thing-kite", kind: "thing", name: "a kite", emoji: "🪁", desc: "A red kite with a long tail.", place: "park", activity: "fly my kite", fx: { joy: 13, energy: -8 } },
  { id: "thing-paints", kind: "thing", name: "a set of watercolour paints", emoji: "🎨", desc: "For the drawing table at the library.", place: "library", activity: "paint with watercolours", fx: { joy: 12, energy: -5, kind: "drawing" } },
  { id: "thing-blanket", kind: "thing", name: "a cosy knitted blanket", emoji: "🧶", desc: "For curling up at home.", place: "house", activity: "curl up in my cosy blanket", fx: { energy: 8, joy: 6 } },
];

const BOOK_GIFTS: Gift[] = Object.values(BOOKS).filter((b) => b.gift).map((b) => ({
  id: `book-${b.slug}`, kind: "book", name: `the book "${b.title}"`, emoji: "📕",
  desc: `${b.title} by ${b.author} (${b.year}). Goes on his library shelf.`, book: b.slug,
}));

export const GIFTS: Gift[] = [...BOOK_GIFTS, ...TREATS, ...SNACKS, ...THINGS];
export const GIFT_BY_ID: Record<string, Gift> = Object.fromEntries(GIFTS.map((g) => [g.id, g]));
