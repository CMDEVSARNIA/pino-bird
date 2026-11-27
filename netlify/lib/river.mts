// The river: a stretch of the St. Clair River running past the west side of Pino's town.
// Summer: paddle, splash, swim about, fish (catch and release). Winter: it slowly freezes over after
// days of hard cold - and with a pair of hockey skates (a gift) he can slowly learn to skate.
import type { Weather } from "./weather.mts";

export const SKATES_GIFT = "thing-skates";
export type River = { ice: number; at: number; catches: { t: string; fish: string }[]; falls: number; skated: number };
export const newRiver = (now: number): River => ({ ice: 0, at: now, catches: [], falls: 0, skated: 0 });

// Ice builds up slowly in hard cold and melts in thaws. ice >= 1 means thick enough to skate on.
// Roughly a day and a bit of -5° or colder to freeze over; once thick, it takes most of a day of thaw to soften.
export function updateIce(r: River, w: Weather | undefined, now: number) {
  const hours = Math.min(6, Math.max(0, (now - (r.at || now)) / 3_600_000));
  r.at = now;
  if (!w) return;
  if (w.temp <= -5) r.ice = Math.min(1.6, r.ice + hours * (0.03 + Math.min(0.05, (-5 - w.temp) * 0.004)));
  else if (w.temp <= 0) r.ice = Math.min(1.6, r.ice + hours * 0.008);
  else if (w.temp > 1) r.ice = Math.max(0, r.ice - hours * (0.01 + w.temp * 0.004)); // thick ice takes a while to melt
}
export const riverFrozen = (r: River | undefined) => (r?.ice ?? 0) >= 1;
export const riverIcy = (r: River | undefined) => (r?.ice ?? 0) >= 0.3 && !riverFrozen(r);

// real fish of the St. Clair River (all let go again)
const FISH: [string, number][] = [
  ["a yellow perch", 30], ["a pumpkinseed sunfish", 24], ["a rock bass", 20], ["a smallmouth bass", 12],
  ["a walleye", 7], ["a northern pike", 5], ["a muskellunge", 1.5], ["a lake sturgeon - the ancient giant of the St. Clair River", 0.5],
];
const FISH_FACTS: Record<string, string> = {
  "a yellow perch": "yellow perch have dark stripes like a tiger and swim around in schools",
  "a pumpkinseed sunfish": "pumpkinseed sunfish have a little red spot on their gill flap and are as colourful as a sweet wrapper",
  "a rock bass": "rock bass have bright red eyes and like to hide among the rocks",
  "a smallmouth bass": "smallmouth bass are fighters - they leap right out of the water",
  "a walleye": "walleye have big glassy eyes that help them see in murky, dim water",
  "a northern pike": "northern pike have a long snout full of teeth and wait still as a stick to ambush their food",
  "a muskellunge": "muskies are called the fish of ten thousand casts because they are so hard to catch",
  "a lake sturgeon - the ancient giant of the St. Clair River": "lake sturgeon have been around since the dinosaurs, can live over 100 years and have no scales, just bony plates",
};

export function riverActivities(r: River | undefined, w: Weather | undefined, seasonName: string, owned: string[], night: boolean) {
  const acts: Record<string, { food?: number; energy?: number; joy?: number }> = {};
  const t = w?.temp ?? 10;
  if (riverFrozen(r)) {
    acts["slide about on the frozen river"] = { joy: 10, energy: -4, food: -2 };
    if (owned.includes(SKATES_GIFT)) acts["skate on the frozen river"] = { joy: 12, energy: -6, food: -3 };
    acts["listen to the river ice creak and boom"] = { joy: 5, energy: 1 };
    return acts;
  }
  acts["watch the river flow by"] = { joy: 5, energy: 3 };
  if (!riverIcy(r)) acts["skip stones across the river"] = { joy: 8, energy: -2 };
  else acts["look at the ice forming along the river's edge"] = { joy: 6, energy: 1 };
  if (!night && t >= 5 && seasonName !== "winter") acts["look for frogs and minnows at the river's edge"] = { joy: 7, energy: -1 };
  if (!night && t >= 10 && seasonName !== "winter" && !riverIcy(r)) acts["go fishing at the river (catch and release)"] = { joy: 9, energy: -2 };
  if (!night && t >= 18 && w?.kind !== "storm") {
    acts["paddle in the shallows of the river"] = { joy: 11, energy: -2 };
    acts["splash about in the river"] = { joy: 14, energy: -5, food: -2 };
  }
  // a proper swim in the calm bend of the river: only on warm, calm days
  if (!night && t >= 20 && w?.kind !== "storm" && w?.kind !== "rain") acts["go for a swim in the river"] = { joy: 15, energy: -6, food: -3 };
  return acts;
}

// skating gets better with practice (his skating skill level, 0-6)
const SKATE_STEPS = [
  "wobbled, windmilled my wings and fell flat on my bottom - three times",
  "managed a few wobbly steps before plop! down I went again",
  "shuffled along holding my wings out for balance, only fell twice",
  "glided a few metres without falling!",
  "skated a whole loop of the ice without a single tumble",
  "skated backwards! and did a little hockey stop that sprayed ice",
  "did a real twirling spin, like the skaters on TV",
];
// swimming gets better with practice too (kiwis can really swim - they're just not graceful about it)
const SWIM_STEPS = [
  "splashed about in a very wobbly doggy-paddle and swallowed a bit of river",
  "paddled in circles with my head held high, very proud of myself",
  "swam a little way along the bank without touching the bottom",
  "swam out to the middle of the calm bend and floated on my back",
  "swam right across the bend and back again",
  "did a smooth little glide and a duck-dive like the ducks do",
  "swam like a real river kiwi - fast, smooth and splashing nobody",
];
export function doRiver(r: River, action: string, t: string, skill: { fishing: number; skating: number; swimming: number }): { note: string; learned?: string } | null {
  if (action === "go fishing at the river (catch and release)") {
    const chance = 0.25 + skill.fishing * 0.1;
    if (Math.random() > chance) return { note: "the bobber bobbed... but nothing bit this time" };
    // practised anglers find the rarer fish
    const pool = FISH.map(([n, w], i) => [n, w * (1 + (i >= 4 ? skill.fishing * 0.4 : 0))] as [string, number]);
    let x = Math.random() * pool.reduce((a, [, w]) => a + w, 0), fish = pool[0][0];
    for (const [n, w] of pool) { x -= w; if (x <= 0) { fish = n; break; } }
    const first = !r.catches.some((c) => c.fish === fish);
    r.catches = [...r.catches, { t, fish }].slice(-60);
    return { note: `caught ${fish}${first ? " (my first one ever!)" : ""} and gently let it go`, learned: first ? FISH_FACTS[fish] : undefined };
  }
  if (action === "go for a swim in the river") {
    const step = Math.min(6, skill.swimming);
    return { note: SWIM_STEPS[step] };
  }
  if (action === "skate on the frozen river") {
    const step = Math.min(6, skill.skating);
    r.skated += 1; if (step <= 1) r.falls += 3 - step;
    return { note: SKATE_STEPS[step] };
  }
  return null;
}

export function riverLine(r: River | undefined, w: Weather | undefined, owned: string[]) {
  const ice = riverFrozen(r) ? "frozen solid - thick enough to walk and slide on" + (owned.includes(SKATES_GIFT) ? ", and you have hockey skates" : " (if only you had some skates)")
    : riverIcy(r) ? "starting to freeze: ice is creeping out from the banks, but it's not safe yet"
    : (w?.temp ?? 10) >= 18 ? "warm enough to paddle and splash in" : "flowing past, cold and clear";
  const caught = r?.catches.length ? ` You've caught and released ${r.catches.length} fish (${[...new Set(r.catches.map((c) => c.fish.split(" - ")[0]))].slice(-5).join(", ")}).` : "";
  return `The river, past your garden on the west side of town (a stretch of the real St. Clair River): right now it's ${ice}. In summer you can paddle, splash, swim and fish there (you always let the fish go).${caught}`;
}

export function riverView(r: River | undefined) {
  if (!r) return { ice: 0, frozen: false, icy: false, catches: [], skated: 0 };
  return { ice: Math.round(r.ice * 100) / 100, frozen: riverFrozen(r), icy: riverIcy(r), catches: r.catches.slice(-12), skated: r.skated };
}
