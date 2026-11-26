// Little things that make Pino's days his own: treasures he finds, the dreams he has, and what he wears.
import { season, wet, type Weather } from "./weather.mts";

// ---- TREASURES: things he spots while he's out and about, and keeps on a shelf at home
export type Treasure = { id: string; name: string; emoji: string; places: string[]; seasons?: string[] };
export const TREASURES: Treasure[] = [
  { id: "pebble", name: "a smooth blue pebble", emoji: "🪨", places: ["park", "garden"] },
  { id: "heartstone", name: "a heart-shaped stone", emoji: "🤍", places: ["park"] },
  { id: "jayfeather", name: "a bright blue jay feather", emoji: "🪶", places: ["park", "gallery"] },
  { id: "duckfeather", name: "a soft duck feather", emoji: "🪶", places: ["park"] },
  { id: "acorn", name: "a shiny acorn with its little cap", emoji: "🌰", places: ["park"], seasons: ["autumn", "winter"] },
  { id: "pinecone", name: "a perfect pinecone", emoji: "🌲", places: ["park", "garden"] },
  { id: "mapleleaf", name: "a bright red maple leaf", emoji: "🍁", places: ["park", "gallery"], seasons: ["autumn"] },
  { id: "clover", name: "a four-leaf clover", emoji: "🍀", places: ["park", "garden"], seasons: ["spring", "summer"] },
  { id: "snailshell", name: "an empty spiral snail shell", emoji: "🐚", places: ["garden", "park"] },
  { id: "marble", name: "a glass marble with a swirl inside", emoji: "🔮", places: ["vending", "gallery"] },
  { id: "bottlecap", name: "a shiny bottle cap", emoji: "🧢", places: ["vending"] },
  { id: "coin", name: "a lucky penny", emoji: "🪙", places: ["vending", "gallery"] },
  { id: "button", name: "a little wooden button", emoji: "🔘", places: ["garden", "gallery"] },
  { id: "crayon", name: "a stubby purple crayon", emoji: "🖍️", places: ["gallery"] },
  { id: "ticket", name: "an old museum ticket stub", emoji: "🎟️", places: ["museum"] },
  { id: "postcard", name: "a dropped postcard of the Mona Lisa", emoji: "🖼️", places: ["museum"] },
  { id: "dandelion", name: "a dandelion clock, ready to wish on", emoji: "🌼", places: ["park", "garden"], seasons: ["spring", "summer"] },
  { id: "seaglass", name: "a sparkly piece of sea glass", emoji: "💎", places: ["park"] },
];
export const TREASURE_BY_ID = Object.fromEntries(TREASURES.map((t) => [t.id, t]));
export type Found = { id: string; t: string; place: string; thought: string; at?: number; shelved?: string };

// Maybe he spots something new here. Treasures are rare: about one moment in 25 outdoors, one in 50 in
// the museum, never more than two a day, and never something he already has (on his shelf or in his pocket).
export function spotTreasure(place: string, have: Found[], now: number): Treasure | null {
  if (Math.random() > (place === "museum" ? 0.02 : 0.04)) return null;
  if (have.filter((f) => f.at && now - f.at < 86_400_000).length >= 2) return null;
  const sea = season(now).name, owned = new Set(have.map((f) => f.id));
  const choices = TREASURES.filter((t) => t.places.includes(place) && !owned.has(t.id) && (!t.seasons || t.seasons.includes(sea)));
  return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null;
}

// ---- DREAMS: when he sleeps a while, he dreams, made from bits of his recent days
export type Dream = { t: string; title: string; text: string };
export const dreamSystem = "You write the dreams of Pino, a small, curious kiwi bird who lives in a little town. " +
  "Dreams are short (3 to 5 sentences), gentle, a bit surreal and funny, written in first person as Pino remembering the dream. " +
  "Mix together real things from his recent days in odd dream ways. Never scary. Reply with JSON only: {\"title\": \"a short dream title\", \"text\": \"the dream\"}.";
export function dreamPrompt(bits: string[]) {
  return `Things from Pino's recent days (mix a few of them together):\n${bits.map((b) => `- ${b}`).join("\n")}\n\nWrite tonight's dream.`;
}

// ---- CLOTHES: he dresses for the real weather outside, plus anything visitors have given him to wear
export type Wearing = { toque: boolean; scarf: boolean; umbrella: boolean; bowtie: boolean; sunhat: boolean; boots: boolean; santa: boolean };
export function wearing(w: Weather | undefined, outdoors: boolean, owned: string[], night: boolean, now = Date.now()): Wearing {
  const cold = !!w && w.temp <= 3, raining = outdoors && wet(w);
  const sunny = !!w && w.temp >= 15 && (w.kind === "clear" || w.kind === "partly") && !night;
  const m = new Date(now).getUTCMonth() + 1, d = new Date(now).getUTCDate();
  const santa = owned.includes("outfit-santa") && (m === 12 || (m === 1 && d <= 6));
  return {
    santa,
    toque: outdoors && cold && !santa && !(owned.includes("outfit-sunhat") && sunny),
    scarf: outdoors && cold,
    umbrella: raining,
    bowtie: owned.includes("outfit-bowtie"),
    sunhat: outdoors && sunny && owned.includes("outfit-sunhat"),
    boots: outdoors && owned.includes("outfit-boots") && (wet(w) || (!!w && (w.kind === "snow" || w.snow >= 1))),
  };
}
export function wearingLine(x: Wearing) {
  const on = [x.santa && "your Santa hat", x.toque && "your red woolly toque", x.scarf && "your stripy scarf", x.sunhat && "your straw sun hat",
    x.bowtie && "your bow tie", x.boots && "your yellow rain boots", x.umbrella && "holding your little umbrella"].filter(Boolean);
  return on.length ? `You're wearing ${on.join(", ").replace(/, ([^,]*)$/, " and $1")}.` : "";
}
