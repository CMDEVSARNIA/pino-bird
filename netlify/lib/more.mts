// More gifts: postcards, hot cocoa, a bird feeder (and seed cakes that bring wild birds), a jigsaw
// puzzle, a star chart, a harmonica, a sled, a Santa hat and fairy lights.
import { season, snowy, type Weather } from "./weather.mts";

export type Postcard = { from: string; place: string; text: string; t: string; at: number };

// ---- wild birds at the feeder (a few come anyway; a seed cake brings the special ones for 3 hours)
const EVERYDAY = ["two house sparrows", "a dark-eyed junco", "a chickadee"];
const SPECIAL = ["a bright red cardinal", "a noisy blue jay", "a downy woodpecker", "a pair of goldfinches", "a mourning dove", "a nuthatch walking upside-down"];
export function birdsAtFeeder(cakeUntil: number, now: number, day: boolean) {
  if (!day) return [];
  const slot = Math.floor(now / 3_600_000), pick = (xs: string[], n: number) => Array.from({ length: n }, (_, i) => xs[(slot * 7 + i * 3) % xs.length]);
  return now < cakeUntil ? [...new Set([...pick(SPECIAL, 3), pick(EVERYDAY, 1)[0]])] : [pick(EVERYDAY, 1)[0]];
}

// ---- the star chart: real constellations he can learn on clear nights
export const CONSTELLATIONS: [string, string][] = [
  ["Orion, the Hunter", "Look for three bright stars in a row: Orion's Belt. Orion is easiest to see on winter evenings."],
  ["the Big Dipper", "Seven bright stars shaped like a ladle. It's part of a bigger constellation called Ursa Major, the Great Bear."],
  ["the North Star, Polaris", "The two stars at the end of the Big Dipper's bowl point to Polaris, which stays almost still while the sky turns around it."],
  ["Cassiopeia", "A wiggly W (or M) of five stars, on the opposite side of the North Star from the Big Dipper."],
  ["the Pleiades", "A tiny misty cluster of stars, sometimes called the Seven Sisters. Most people can spot about six of them."],
  ["Cygnus, the Swan", "Also called the Northern Cross. Its brightest star, Deneb, is very far away and very bright."],
  ["Taurus, the Bull", "Find the orange star Aldebaran - it's the bull's eye - near the Pleiades."],
  ["Gemini, the Twins", "Two bright stars side by side, Castor and Pollux, are the twins' heads."],
];
export const clearSky = (w?: Weather) => !!w && (w.kind === "clear" || w.kind === "partly");

// ---- the jigsaw puzzle: 500 pieces of The Great Wave, a few dozen pieces at a time
export const PUZZLE_PIECES = 500;
export type Puzzle = { placed: number; done: number }; // done = how many puzzles he's finished

// ---- the harmonica: he gets better the more he plays
export const harmonicaSkill = (plays: number) => Math.min(1, plays / 25);

// ---- extra things to do, depending on the gifts he has and the real weather and time
export type More = {
  postcards?: Postcard[]; birdCakeUntil?: number; puzzle?: Puzzle; stars?: string[]; harmonica?: number; sledRuns?: number;
};
export function moreActivities(m: More, place: string, owned: string[], w: Weather | undefined, night: boolean, now: number) {
  const acts: Record<string, { food?: number; energy?: number; joy?: number }> = {};
  const has = (id: string) => owned.includes(id);
  if (place === "house" && (m.postcards?.length ?? 0) > 0) acts["read the postcards pinned on my wall"] = { joy: 6, energy: 1 };
  if (has("thing-feeder") && (place === "garden" || place === "house") && birdsAtFeeder(m.birdCakeUntil ?? 0, now, !night).length)
    acts["watch the birds at my bird feeder"] = { joy: 9, energy: 1 };
  if (has("thing-puzzle") && place === "house") acts[(m.puzzle?.placed ?? 0) >= PUZZLE_PIECES ? "start my jigsaw puzzle again" : "work on my jigsaw puzzle"] = { joy: 8, energy: -2 };
  if (has("thing-starchart") && place === "park" && night && clearSky(w)) acts["look for constellations with my star chart"] = { joy: 12, energy: -1 };
  if (has("thing-harmonica") && (place === "house" || place === "park" || place === "garden")) acts["play my harmonica"] = { joy: 9, energy: -2 };
  if (has("thing-sled") && place === "park" && snowy(w)) acts["go sledding down the snowy hill"] = { joy: 16, energy: -8, food: -4 };
  if (has("thing-lights") && place === "house" && night) acts["lie back and watch my fairy lights twinkle"] = { joy: 6, energy: 4 };
  return acts;
}

// Carry out one of those; returns a note about what happened, and anything he learned
export function doMore(m: More, action: string, w: Weather | undefined, now: number): { note: string; learned?: string } {
  if (action === "work on my jigsaw puzzle" || action === "start my jigsaw puzzle again") {
    m.puzzle ??= { placed: 0, done: 0 };
    if (m.puzzle.placed >= PUZZLE_PIECES) m.puzzle.placed = 0;
    m.puzzle.placed = Math.min(PUZZLE_PIECES, m.puzzle.placed + 20 + Math.floor(Math.random() * 30));
    if (m.puzzle.placed >= PUZZLE_PIECES) { m.puzzle.done += 1; return { note: `finished the whole 500-piece Great Wave puzzle!` }; }
    return { note: `${m.puzzle.placed} of ${PUZZLE_PIECES} pieces placed` };
  }
  if (action === "look for constellations with my star chart") {
    m.stars ??= [];
    const next = CONSTELLATIONS.find(([n]) => !m.stars!.includes(n));
    if (!next) return { note: "spotted all my favourite constellations again" };
    m.stars.push(next[0]);
    return { note: `found ${next[0]}`, learned: `${next[0]}: ${next[1]}` };
  }
  if (action === "play my harmonica") { m.harmonica = (m.harmonica ?? 0) + 1; return { note: harmonicaSkill(m.harmonica) < 0.3 ? "squeaky, but it's a start" : harmonicaSkill(m.harmonica) < 0.7 ? "the tune is starting to sound like a tune" : "played a real little melody" }; }
  if (action === "go sledding down the snowy hill") { m.sledRuns = (m.sledRuns ?? 0) + 1; return { note: `sled run number ${m.sledRuns}` }; }
  return { note: "" };
}

export function moreLines(m: More, owned: string[], w: Weather | undefined, night: boolean, now: number) {
  const lines: string[] = [];
  const pc = m.postcards ?? [];
  if (pc.length) lines.push(`Postcards pinned on your wall at home (${pc.length}): ${pc.slice(-4).map((p) => `from ${p.from} in ${p.place}: "${p.text}"`).join("; ")}.`);
  if (owned.includes("thing-feeder")) {
    const birds = birdsAtFeeder(m.birdCakeUntil ?? 0, now, !night);
    lines.push(`Your bird feeder (by the garden): ${birds.length ? `visiting right now: ${birds.join(", ")}` : "the wild birds are asleep for the night"}${now < (m.birdCakeUntil ?? 0) ? " - someone put out a seed cake, so special birds are coming!" : ""}.`);
  }
  if (owned.includes("thing-puzzle")) lines.push(`Your jigsaw puzzle of The Great Wave on your table at home: ${m.puzzle?.placed ?? 0} of ${PUZZLE_PIECES} pieces placed${m.puzzle?.done ? ` (you've finished it ${m.puzzle.done} time${m.puzzle.done === 1 ? "" : "s"})` : ""}.`);
  if (owned.includes("thing-starchart")) lines.push(`Your star chart: constellations you've found so far: ${(m.stars ?? []).join(", ") || "none yet"} (you can use it in the park on clear nights).`);
  if (owned.includes("thing-harmonica")) lines.push(`Your harmonica: you've played it ${m.harmonica ?? 0} times${harmonicaSkill(m.harmonica ?? 0) >= 0.7 ? " and you're getting good" : ""}.`);
  if (owned.includes("thing-sled")) lines.push(`Your sled: ${snowy(w) ? "there's snow on the hill behind the park - perfect for sledding!" : "waiting for snow on the hill behind the park"}.`);
  if (owned.includes("thing-lights")) lines.push(`Fairy lights are strung up in your house${night ? " and they're twinkling right now" : ""}.`);
  return lines.map((l) => l.replace(/!\.$/, "!"));
}

export const santaSeason = (now: number) => {
  const d = new Date(now); const m = d.getUTCMonth() + 1, day = d.getUTCDate();
  return m === 12 || (m === 1 && day <= 6);
};
export const cocoaWeather = (w: Weather | undefined, now: number) => season(now).name === "winter" || (!!w && w.temp <= 5);
