// Pino's TV: five free channels, all made here in town, so there's always something true or fun on.
// Each programme is plain text, so Pino really "watches" it: he gets the same lines the screen shows.
import type { Weather } from "./weather.mts";

export type TV = { on: boolean; channel: string; since: number };
export type Programme = { channel: string; name: string; emoji: string; title: string; lines: string[]; moon?: number };

export const CHANNELS: { id: string; name: string; emoji: string }[] = [
  { id: "weather", name: "Sarnia Weather", emoji: "🌦️" },
  { id: "aquarium", name: "Aquarium Cam", emoji: "🐠" },
  { id: "space", name: "Space Channel", emoji: "🔭" },
  { id: "news", name: "Town News", emoji: "📰" },
  { id: "cartoons", name: "Cartoon Corner", emoji: "📺" },
];
export const TV_OFF: TV = { on: false, channel: "weather", since: 0 };

const FISH: [string, string][] = [
  ["a clownfish", "Clownfish live among stinging sea anemones; a slimy coat keeps them from getting stung."],
  ["two neon tetras", "Neon tetras come from rivers in the Amazon, and their bright blue stripe helps them find each other in dark water."],
  ["a seahorse", "With seahorses it's the dad who carries the eggs, in a pouch on his tummy, until the babies hatch."],
  ["a pufferfish", "When a pufferfish is frightened it gulps water and swells up like a spiky balloon."],
  ["a goldfish", "Goldfish can see colours people can't, including ultraviolet light."],
  ["an angelfish", "Freshwater angelfish come from the Amazon and glide between tall water plants."],
  ["a blue tang", "Blue tangs are a kind of surgeonfish: they have a sharp spine near the tail, like a tiny scalpel."],
];
const SPACE: string[] = [
  "A day on Venus is longer than its whole year: it spins very slowly, taking 243 Earth days to turn once.",
  "Sunlight takes about 8 minutes to travel from the Sun to Earth.",
  "The International Space Station zooms all the way around Earth in about an hour and a half.",
  "Olympus Mons on Mars is the tallest volcano in the solar system - more than twice as tall as Mount Everest.",
  "Saturn's rings are made mostly of chunks of ice, some as small as grains of sand and some as big as houses.",
  "The footprints astronauts left on the Moon can last for millions of years, because there's no wind there to blow them away.",
];
// original cartoons, written for Pino's TV
const CARTOONS: [string, string[]][] = [
  ["Captain Puffin and the Lost Mitten", ["Captain Puffin sails his teacup boat across the bathtub sea to find a mitten that blew away.", "A grumpy rubber duck turns out to be keeping it warm for a baby snail.", "They decide the snail can keep it, and everyone sings a sea shanty."]],
  ["Hedgehog's Very Long Nap", ["Hattie the hedgehog plans a five-minute nap and wakes up in spring.", "She tries to tell everyone about winter, but she slept through all of it.", "Her friends tell her the whole winter story instead, with snowball sound effects."]],
  ["The Moon Who Wanted a Hat", ["The Moon feels chilly and asks the town to knit it a hat.", "A clever spider knits one out of silver thread and clouds.", "Now on cold nights the Moon wears its fuzzy cloud hat."]],
  ["Snail Mail", ["Shelby the snail is the slowest postman in the world.", "His letters arrive so late that the news inside is always a surprise all over again.", "Everyone agrees surprises are the best kind of mail."]],
  ["The Grand Worm Bake-Off", ["Three robins enter a pie contest, but the worms keep wriggling out of the pies.", "The worms open their own bakery instead and make muffins.", "The judges say it's the best bake-off in history."]],
  ["Penguin Goes Skating", ["A little penguin tries ice-skating for the first time and slides everywhere on his tummy.", "He discovers tummy-sliding is actually faster than skating.", "By the end, the whole pond is tummy-sliding with him."]],
];

const pick = <T,>(xs: T[], n: number) => xs[((n % xs.length) + xs.length) % xs.length];

// Moon phase: 0 = new moon, 0.5 = full moon
export function moonPhase(now: number) {
  const synodic = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
  return (((now - ref) / 86_400_000) % synodic + synodic) % synodic / synodic;
}
function moonName(p: number) {
  if (p < 0.03 || p > 0.97) return "a new moon (almost invisible)";
  if (p < 0.22) return "a thin waxing crescent";
  if (p < 0.28) return "a first-quarter half moon";
  if (p < 0.47) return "a waxing gibbous moon";
  if (p < 0.53) return "a full moon";
  if (p < 0.72) return "a waning gibbous moon";
  if (p < 0.78) return "a last-quarter half moon";
  return "a thin waning crescent";
}

type NewsSource = {
  weather?: Weather;
  gifts?: { log: { name: string; from: string }[] };
  museumLog?: { name: string }[];
  drawings?: { title?: string; svg?: string }[];
  readingLog?: { title: string }[];
};

export function programme(channel: string, s: NewsSource, now: number): Programme {
  const ch = CHANNELS.find((c) => c.id === channel) ?? CHANNELS[0];
  const hour = Math.floor(now / 3_600_000), half = Math.floor(now / 1_800_000);
  const base = { channel: ch.id, name: ch.name, emoji: ch.emoji };
  if (ch.id === "weather") {
    const w = s.weather;
    if (!w) return { ...base, title: "The weather report", lines: ["The weather forecaster is still getting ready. Check back soon!"] };
    return { ...base, title: "Your Sarnia forecast", lines: [
      `Right now: ${w.desc}, ${w.temp}°C${w.wind >= 20 ? `, wind ${w.wind} km/h` : ""}.`,
      ...(w.forecast ?? []).slice(1, 4).map((d) => `${d.day}: ${d.desc}, high ${d.hi}°, low ${d.lo}°.`),
    ] };
  }
  if (ch.id === "aquarium") {
    const fish = [pick(FISH, hour), pick(FISH, hour + 3)];
    return { ...base, title: "Live from the aquarium", lines: [`Swimming past: ${fish[0][0]} and ${fish[1][0]}.`, fish[0][1], fish[1][1]] };
  }
  if (ch.id === "space") {
    const p = moonPhase(now);
    return { ...base, title: "Tonight's sky", moon: Math.round(p * 1000) / 1000, lines: [`Tonight there's ${moonName(p)}.`, pick(SPACE, hour)] };
  }
  if (ch.id === "news") {
    const lines: string[] = [];
    const g = s.gifts?.log?.at(-1); if (g) lines.push(`GIFT: ${g.from} gave Pino ${g.name}.`);
    const m = s.museumLog?.at(-1); if (m) lines.push(`MUSEUM: Pino was spotted admiring ${m.name}.`);
    const d = [...(s.drawings ?? [])].reverse().find((x) => x.svg && x.title); if (d) lines.push(`ART: A new drawing, "${d.title}", is the talk of the town.`);
    const r = s.readingLog?.at(-1); if (r) lines.push(`BOOKS: Pino has been reading "${r.title}".`);
    if (s.weather) lines.push(`WEATHER: ${s.weather.desc} over town, ${s.weather.temp}°C.`);
    return { ...base, title: "Town News - all about Pino's town", lines: lines.length ? lines : ["A quiet day in town. Nothing to report... yet!"] };
  }
  const [title, story] = pick(CARTOONS, half);
  return { ...base, title, lines: story };
}

export const nextChannel = (id: string) => CHANNELS[(CHANNELS.findIndex((c) => c.id === id) + 1) % CHANNELS.length].id;
export const randomChannel = () => CHANNELS[Math.floor(Math.random() * CHANNELS.length)].id;
