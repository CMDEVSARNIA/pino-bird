// Pino's pet betta fish: lives in a tank in his house. He names it, feeds it and gets to know it.
// It can never get sick or die - if he forgets about it, it just goes a bit mopey until he comes back.

export const FISH_GIFT = "thing-fishtank";
export type Fish = {
  name?: string; color: string; hex: string; from: string; got: number;
  fed: number; played: number; cleaned: number;
  traits: string[]; nestUntil?: number; nests: number;
  log: { t: string; what: string }[];
};
const COLORS: [string, string][] = [["royal blue", "#2a5bd7"], ["ruby red", "#c4233a"], ["violet", "#7a3fc4"], ["turquoise", "#1fb3ad"], ["copper orange", "#e07a2c"]];
// things he can find out about his fish by spending time with it
const TRAITS = [
  "flares out his fins at his own reflection, like a tiny grumpy dragon",
  "follows the tip of my beak along the glass",
  "naps on the big leaf near the top of the tank",
  "does a little wiggle-dance when he knows food is coming",
  "hides in his castle when it gets dark",
  "chases the bubbles from the filter",
  "lies sideways on the gravel when he's bored (he's fine - just dramatic)",
  "swims to the front of the tank when I come into the room",
  "takes his food from the very top, never from the bottom",
  "spreads his tail out like a fan when he's happy",
];
const H = 3_600_000;

export function newFish(from: string, now: number): Fish {
  const [color, hex] = COLORS[Math.floor(Math.random() * COLORS.length)];
  return { color, hex, from, got: now, fed: now, played: now, cleaned: now, traits: [], nests: 0, log: [] };
}

// how the fish is doing (never anything worse than mopey)
export function fishMood(f: Fish, now: number): { id: string; word: string; why: string } {
  const hungry = now - f.fed > 12 * H, bored = now - f.played > 10 * H, cloudy = now - f.cleaned > 4 * 24 * H;
  if (hungry && bored) return { id: "mopey", word: "mopey", why: "he's hungry and nobody's played with him for a while" };
  if (hungry) return { id: "hungry", word: "hungry", why: "he hasn't been fed for a while" };
  if (cloudy) return { id: "sluggish", word: "a bit sluggish", why: "his tank water is getting cloudy" };
  if (bored) return { id: "bored", word: "bored", why: "nobody's played with him for a while" };
  if (f.nestUntil && now < f.nestUntil) return { id: "proud", word: "proud", why: "he's built a bubble nest" };
  return { id: "happy", word: "happy", why: "fed, played with and swimming about" };
}
const cloudyTank = (f: Fish, now: number) => now - f.cleaned > 4 * 24 * H;

export function fishActivities(f: Fish | undefined, place: string, now: number) {
  const acts: Record<string, { food?: number; energy?: number; joy?: number }> = {};
  if (!f || place !== "house") return acts;
  if (!f.name) acts["give my new fish a name"] = { joy: 10 };
  if (now - f.fed > 4 * H) acts["feed my fish"] = { joy: 5 };
  acts["watch my fish swim"] = { joy: 6, energy: 1 };
  acts["play with my fish by tracing my beak along the glass"] = { joy: 8 };
  if (now - f.cleaned > 2 * 24 * H) acts["clean my fish tank"] = { joy: 4, energy: -4 };
  return acts;
}

const cleanName = (n: string) => n.replace(/[^\p{L}\p{N} '-]/gu, "").trim().split(/\s+/).slice(0, 3).join(" ").slice(0, 20);
const FALLBACK_NAMES = ["Bubbles", "Finn", "Captain Splash", "Blue", "Ripple", "Sir Swims"];

// Carry out a fish activity. Returns a note for the diary and anything newly learned about the fish.
export function doFish(f: Fish | undefined, action: string, note: string, t: string, now: number): { note: string; learned?: string } | null {
  if (!f || !/my (new )?fish|fish tank/.test(action)) return null;
  const nm = () => f.name ?? "my fish";
  const learn = (chance: number) => {
    const next = TRAITS.filter((x) => !f.traits.includes(x));
    if (!next.length || Math.random() > chance) return undefined;
    const tr = next[Math.floor(Math.random() * next.length)];
    f.traits.push(tr);
    return tr;
  };
  // a well-looked-after betta sometimes builds a bubble nest
  const maybeNest = () => {
    const cared = now - f.fed < 8 * H && now - f.played < 12 * H && !cloudyTank(f, now);
    if (cared && !(f.nestUntil && now < f.nestUntil) && Math.random() < 0.18) { f.nestUntil = now + 18 * H; f.nests += 1; return true; }
    return false;
  };
  let out: { note: string; learned?: string };
  if (action === "give my new fish a name") {
    f.name = cleanName(note) || FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
    out = { note: `I named him ${f.name}!` };
  } else if (action === "feed my fish") {
    f.fed = now;
    out = { note: maybeNest() ? `fed ${nm()} - and he's built a bubble nest at the top of the tank!` : `fed ${nm()} a pinch of food` };
  } else if (action === "watch my fish swim") {
    const tr = learn(0.3);
    out = tr ? { note: `noticed that ${nm()} ${tr}`, learned: `${nm()} ${tr}` } : { note: maybeNest() ? `watched ${nm()} build a bubble nest!` : `watched ${nm()} drift and twirl` };
  } else if (action === "play with my fish by tracing my beak along the glass") {
    f.played = now;
    const tr = learn(0.25);
    out = tr ? { note: `played with ${nm()} - he ${tr}`, learned: `${nm()} ${tr}` } : { note: maybeNest() ? `played with ${nm()}, who then built a bubble nest!` : `${nm()} chased my beak up and down the glass` };
  } else if (action === "clean my fish tank") {
    f.cleaned = now;
    out = { note: `the water in ${nm()}'s tank is sparkling clear again` };
  } else return null;
  f.log = [...f.log, { t, what: out.note }].slice(-40);
  return out;
}

export function fishLines(f: Fish | undefined, now: number) {
  if (!f) return "";
  if (!f.name) return `You have a new pet: a ${f.color} betta fish in a tank in your house (a gift from ${f.from}). He doesn't have a name yet - you get to choose it.`;
  const m = fishMood(f, now);
  return `Your pet: ${f.name}, a ${f.color} betta fish who lives in a tank in your house (a gift from ${f.from}). Right now he's ${m.word} (${m.why}). ` +
    (f.traits.length ? `Things you've noticed about him: ${f.traits.slice(-5).join("; ")}. ` : "You're still getting to know him. ") +
    (f.nests ? `He's built ${f.nests} bubble nest${f.nests === 1 ? "" : "s"}. ` : "") +
    "He needs feeding about twice a day, playing with, and his tank cleaned every few days. He can't get ill - just mopey if you forget him.";
}

export function fishView(f: Fish | undefined, now: number) {
  if (!f) return null;
  const m = fishMood(f, now);
  return { name: f.name ?? null, color: f.color, hex: f.hex, mood: m, traits: f.traits, nest: !!(f.nestUntil && now < f.nestUntil), cloudy: cloudyTank(f, now),
    fedAgo: now - f.fed, nests: f.nests, from: f.from, log: f.log.slice(-8) };
}
