// The bird's world and mind. Pure logic - no storage here, so it's easy to test.

import { BOOKS } from "./library.mts";
import { GIFT_BY_ID, TEDDY_ID } from "./gifts.mts";
import { CROPS, doGarden, gardenActivities, gardenLine, gardenView, newGarden, type Garden } from "./garden.mts";
import { holiday } from "./holidays.mts";
import { spotTreasure, TREASURE_BY_ID, wearing, wearingLine, type Dream, type Found } from "./extras.mts";
import { birdsAtFeeder, cocoaWeather, doMore, harmonicaSkill, moreActivities, moreLines, PUZZLE_PIECES, type More } from "./more.mts";
import { SONG_BY_ID, nextSong, randomSong, silence, songsOwned, type Music } from "./music.mts";
import { recall } from "./memory.mts";
import { frozenPond, outdoorFeeling, season, snowy, weatherDrain, weatherLine, wet, type Weather } from "./weather.mts";
import { EXHIBITS, EXHIBIT_BY_ID, exhibitAction, exhibitFromAction } from "./museum.mts";
import { nextChannel, programme, randomChannel, TV_OFF, type TV } from "./tv.mts";

export const NAME = "Pino";
export const SPECIES = "kiwi bird";
export const TZ = "America/Toronto"; // day and night follow real Toronto time
export const REFLECT_EVERY = 12;     // reflects every 12 decisions
export const FAST_HOURS = 3;         // for his first 3 hours he thinks about twice a minute, then every 5 minutes

// Minutes between his decisions right now
export function paceMinutes(s: { born: number; boostUntil?: number }, now: number) {
  if (now - s.born < FAST_HOURS * 3_600_000) return 0.5;
  return now < (s.boostUntil ?? 0) ? 1 : 5; // the owner can switch on fast thinking from his phone
}

export type Need = "food" | "energy" | "joy";
export const NEEDS: Need[] = ["food", "energy", "joy"];

type Effects = { food?: number; energy?: number; joy?: number; kind?: "journal" | "drawing" };
type Place = { label: string; desc: string; activities: Record<string, Effects> };

// ---------------------------------------------------------------------------
// The town. Add places or activities here; the bird will discover them.
// Numbers change his needs (0-100). The viewer page needs a matching spot
// in its SPOTS table to draw a new place.
// ---------------------------------------------------------------------------
export const PLACES: Record<string, Place> = {
  house: {
    label: "little house",
    desc: "your little round house with a soft bed, a rug and a window that looks out over the path",
    activities: {
      "sleep in my bed": { energy: 14, food: -1 },
      "tidy up the house": { joy: 4, energy: -3, food: -1 },
      "look out the window": { joy: 4, energy: 2 },
    },
  },
  library: {
    label: "library",
    desc: "the town library, quiet and warm, full of old books and a big wooden drawing table; tucked inside at the back is your cozy reading nook with a squashy armchair, a lamp and a little crackling fireplace",
    activities: {
      "write in my journal": { joy: 6, energy: -2, kind: "journal" },
      "curl up in the cozy reading nook inside the library": { energy: 7, joy: 7 },
      "draw a picture": { joy: 10, energy: -5, kind: "drawing" },
    },
  },
  vending: {
    label: "vending machine",
    desc: "a humming vending machine by the path. It needs no coins - you just press a button",
    activities: {
      "get a seed bar": { food: 32, joy: 2 },
      "get a bag of worm crisps": { food: 24, joy: 7 },
      "get a berry juice": { food: 12, energy: 8, joy: 4 },
    },
  },
  gallery: {
    label: "art gallery",
    desc: "your own little open-air art gallery, with frames on the walls for your drawings",
    activities: {
      "look at the art on the walls": { joy: 6, energy: 1 },
    },
  },
  park: {
    label: "park",
    desc: "a small park with a big tree, a leaf pile, a bench, a swing set, a pond where ducks paddle about, and your gramophone (a wind-up record player)",
    activities: {
      "swing on the swings": { joy: 14, energy: -5, food: -2 },
      "play in the leaf pile": { joy: 12, energy: -7, food: -3 },
      "watch the ducks": { joy: 6, energy: 3 },
      "sit on the bench": { joy: 3, energy: 5 },
    },
  },
  garden: {
    label: "garden",
    desc: "your garden to the left of your house: two raised beds under a glass cold frame, where whatever you plant grows all year round",
    activities: {}, // depends on what's planted (see garden.mts)
  },
  museum: {
    label: "museum",
    desc: "the grand town museum with a dome and stone columns, full of real treasures from around the world: famous paintings, a T. rex skeleton, ancient wonders like the Rosetta Stone, and things from space. Every exhibit has a plaque that tells its true story",
    activities: {}, // its exhibits (see museum.mts)
  },
};
// places that are outdoors (weather reaches him there)
export const OUTDOORS = new Set(["park", "gallery", "vending", "garden"]);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export type Memory = {
  t: string; place: string; action: string; thought: string; note: string;
  deltas: Partial<Record<Need, number>>; first: boolean; bored: boolean; brain: string;
};
export type Note = { key: string; text: string; at: number };
export type Drawing = { t: string; text: string; title?: string; svg?: string; skill?: number; seed?: number; lesson?: string; tries?: number; drawStart?: number; drawMs?: number };
// a drawing he's still putting on paper (everyone can watch it appear, stroke by stroke)
export const drawingInProgress = (s: { drawings: Drawing[] }, now: number) => s.drawings.find((d) => d.svg && d.drawStart && now < d.drawStart + (d.drawMs ?? 0));
export type Want = { t: string; want: string; why: string; size?: string };
export type State = {
  born: number; tick: number; place: string;
  needs: Record<Need, number>;
  personality: string;
  insights: { t: string; text: string }[];
  memories: Memory[];
  journal: { t: string; text: string }[];
  drawings: Drawing[];
  books: Record<string, number>;                // pages read in each book
  lastRead: { slug: string; page: number } | null; // what he just read (he reacts next moment)
  readingLog: { t: string; slug: string; title: string; page: number; of: number; reaction: string }[];
  pendingDrawing: number | null;                 // index of a drawing he still has to put on paper
  art: { drawn: number; lessons: string[]; studied?: number }; // practice, notes-to-self, and pages of drawing manuals studied
  gifts: { received: string[]; log: { t: string; id: string; name: string; emoji: string; from: string }[] };
  music: Music;                                  // the gramophone in the park
  galleryWall: (Drawing & { hungAt: string })[]; // drawings he chose to hang in his art gallery
  walls?: Record<string, (Drawing & { hungAt: string })[]>; // drawings he hung at home and in the library
  weather?: Weather;                             // the real weather in Sarnia, checked every 15 minutes
  lastSaw?: string | null;                       // museum exhibit he just looked at (he reacts next moment)
  museumLog?: { t: string; id: string; name: string; reaction: string }[];
  teddy?: { holding: boolean; place: string };   // his penguin teddy: in his wing, or left somewhere in town
  tv?: TV;                                       // the TV in his house
  boostUntil?: number;                           // fast (once-a-minute) thinking until this time, set by the owner
  treasures?: Found[];                           // things he's found and keeps on his shelf at home
  pocket?: Found[];                              // treasures he's carrying home (he has to take them home to shelve them)
  pocketFix?: boolean;                           // one-off: move early finds into his pocket
  more?: More;                                   // postcards, bird feeder, puzzle, star chart, harmonica, sled
  justLearned?: string | null;
  doingSince?: number;                           // when he started what he's doing (keeps everyone's view in step)
  furniture?: { house: number; library: number; at?: number }; // which furniture layout each room is in                   // something he just learned (a constellation) - he reacts next moment
  dreams?: Dream[];                              // dreams he's had
  asleepSince?: number;                          // when he dozed off (for dreaming)
  pendingDream?: boolean;                        // he slept a while: a dream is waiting to be written down
  justDreamed?: Dream | null;                    // the dream he just woke from (he can think about it once)
  watchers?: { ids: string[]; names: string[]; unnamed: number; at: number; arrived: string[]; left: string[]; near?: string[]; nearUnnamed?: number; cameIn?: string[] }; // who's watching him right now
  garden?: Garden;                               // his garden beds, seed packets and harvest
  lettersSent?: Record<string, number>;          // person id -> when he last wrote to them
  outbox?: { to: string; name: string; text: string; t: string; at: number }[]; // letters waiting to be delivered
  lastWatched?: { channel: string; title: string; lines: string[] } | null; // what he just watched (he reacts next moment)
  tvLog?: { t: string; channel: string; title: string; reaction: string }[];
  wants: Want[];                                 // what he wants right now, in his own words
  pastWants: Want[];                             // wishes he's let go of or moved on from
  conversations: { t: string; visitor: string; reply: string }[];
  tried: Record<string, number>;
  thought: string; doing: string;
  last_error: string; last_tick_at: number;
};

export function newState(now: number): State {
  return {
    born: now, tick: 0, place: "house",
    needs: { food: 70, energy: 80, joy: 50 },
    personality: "I'm new here and I don't know what I like yet. I want to find out.",
    insights: [], memories: [], journal: [], drawings: [], conversations: [], tried: {},
    books: {}, lastRead: null, readingLog: [], pendingDrawing: null, wants: [], pastWants: [], art: { drawn: 0, lessons: [] },
    gifts: { received: [], log: [] }, music: silence(), galleryWall: [],
    thought: "Where am I? It's cosy here...", doing: "waking up for the first time",
    last_error: "", last_tick_at: 0,
  };
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------
export function localTime(now: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "long",
  }).formatToParts(new Date(now));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { hour: Number(get("hour")), minute: Number(get("minute")), weekday: get("weekday") };
}

export function clockStr(s: State, now: number) {
  const { hour, minute } = localTime(now);
  const day = Math.floor((now - s.born) / 86_400_000) + 1;
  return `Day ${day}, ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isNight(now: number) {
  const { hour } = localTime(now);
  return hour >= 22 || hour < 6;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function describe(n: Need, v: number) {
  const words = {
    food: ["starving", "hungry", "fine", "full"],
    energy: ["exhausted", "tired", "okay", "full of energy"],
    joy: ["miserable", "a bit low", "content", "really happy"],
  }[n];
  return v < 15 ? words[0] : v < 40 ? words[1] : v < 78 ? words[2] : words[3];
}

const fmtDeltas = (d: Partial<Record<Need, number>>) =>
  Object.entries(d).filter(([, v]) => v).map(([k, v]) => `${k} ${v! > 0 ? "+" : ""}${v}`).join(", ") || "no change";

function memoryLine(m: Memory) {
  const extra = (m.first ? " [first time!]" : "") + (m.bored ? " [felt boring]" : "");
  return `- [${m.t}] at the ${PLACES[m.place]?.label ?? m.place}: ${m.action} (${fmtDeltas(m.deltas)})${extra}. I thought: "${m.thought}"`;
}

export function parseJSON(text: string): any {
  if (!text) return null;
  const cleaned = text.replace(/^```(?:json)?|```$/gm, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch { /* fall through */ }
    // raw line breaks inside strings are a common slip: escape them and retry
    try { return JSON.parse(m[0].replace(/\r?\n/g, "\\n")); } catch { /* fall through */ }
  }
  // last resort: pull the fields out one by one, even from a reply that was cut short
  const out: Record<string, string> = {};
  for (const key of ["thought", "choice", "note", "reply", "mood", "remember", "their_name", "title", "lesson"]) {
    const f = cleaned.match(new RegExp(`"${key}"\\s*:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"?|(\\d+))`));
    if (f) out[key] = (f[1] ?? f[2] ?? "").replace(/\\n/g, " ").replace(/\\"/g, '"').trim();
  }
  return Object.keys(out).length ? out : null;
}

// ---------------------------------------------------------------------------
// Options and prompts
// ---------------------------------------------------------------------------
// What he can do at a place: the town's basics plus anything visitors have given him
export function activitiesAt(s: State, place: string): Record<string, Effects> {
  const acts: Record<string, Effects> = { ...PLACES[place].activities };
  if (place === "museum") for (const e of EXHIBITS) acts[exhibitAction(e)] = { joy: 7, energy: -1 };
  if (place === "garden") Object.assign(acts, gardenActivities(s.garden ?? newGarden(Date.now()), Date.now()));
  const w = s.weather, sea = season(Date.now()).name;
  if (place === "park") {
    // the seasons and the real weather change what there is to do
    if (sea !== "autumn") delete acts["play in the leaf pile"];
    if (sea === "spring") acts["smell the spring flowers"] = { joy: 7, energy: 1 };
    if (sea === "summer" && (w?.temp ?? 20) >= 18) acts["paddle my feet in the pond"] = { joy: 10, energy: 2 };
    if (snowy(w)) {
      acts["build a little snow-kiwi"] = { joy: 13, energy: -6, food: -3 };
      acts["flop down in the soft snow"] = { joy: 10, energy: -4, food: -2 };
    }
    if (w?.kind === "snow") acts["catch snowflakes on my beak"] = { joy: 9, energy: -2 };
    if (frozenPond(w)) { delete acts["watch the ducks"]; acts["slide on the frozen pond"] = { joy: 14, energy: -5, food: -3 }; }
    if (wet(w)) {
      acts["splash in the puddles"] = { joy: 11, energy: -4, food: -2 };
      acts["shelter under the big tree"] = { energy: 2, joy: 2 };
    }
  }
  // the penguin teddy: pick it up where he left it, hug it while carrying it, put it down anywhere
  if (s.teddy) {
    if (s.teddy.holding) {
      acts["hug my penguin teddy"] = { joy: 8, energy: 1 };
      acts["put my penguin teddy down here"] = { joy: 1 };
    } else if (s.teddy.place === place) acts["pick up my penguin teddy"] = { joy: 4 };
  }
  if (place === "house" && (s.treasures?.length ?? 0) > 0) acts["admire my treasure shelf"] = { joy: 5, energy: 1 };
  // rearranging the furniture: a big job, so not more than once every few hours
  if ((place === "house" || place === "library") && Date.now() - (s.furniture?.at ?? 0) > 3 * 3_600_000)
    acts[`rearrange the furniture in the ${place === "house" ? "house" : "library"}`] = { joy: 9, energy: -7, food: -3 };
  if (place === "house") {
    // the TV: five free channels
    if (!s.tv?.on) acts["turn on the TV"] = { joy: 3 };
    else {
      acts["watch TV"] = { joy: 6, energy: 3 };
      acts["flip to the next TV channel"] = { joy: 3 };
      acts["turn off the TV"] = { energy: 1 };
    }
    if (wet(w)) acts["listen to the rain on the roof"] = { energy: 6, joy: 5 };
    if (w?.kind === "snow") acts["watch the snow fall from the window"] = { joy: 7, energy: 2 };
  }
  if (place === "park") {
    if (!s.music?.on) acts["turn on the gramophone"] = { joy: 6 };
    else {
      acts["skip to the next song"] = { joy: 3 };
      acts["dance to the music"] = { joy: 12, energy: -6, food: -4 };
      acts["turn off the gramophone"] = { energy: 1 };
    }
  }
  for (const id of s.gifts?.received ?? []) {
    const g = GIFT_BY_ID[id];
    if (g?.place === place && g.activity) acts[g.activity] = { ...(g.fx ?? {}) };
  }
  Object.assign(acts, moreActivities(s.more ?? {}, place, s.gifts?.received ?? [], w, isNight(Date.now()) || s.weather?.day === false, Date.now()));
  return acts;
}

export function hasBook(s: State, slug: string) {
  const b = BOOKS[slug];
  return !!b && (!b.gift || (s.gifts?.received ?? []).includes(`book-${slug}`));
}

export type Option = { type: "do" | "go" | "reply" | "rest" | "read" | "hang" | "letter" | "find" | "shelve"; name: string; label: string };
export type Pal = { id: string; name: string; note?: string };

export const GALLERY_SIZE = 6;
// He can rearrange the furniture at home and in the library (each room has three layouts drawn in 3D)
export const LAYOUTS: Record<string, string[]> = {
  house: ["the armchair facing the TV, the little table by the door, the rug in the middle",
          "the armchair snug by the fireplace, the table near the window, the rug by the front",
          "the armchair out in the open, the table beside the bed, the rug in front of the TV"],
  library: ["the drawing table by the side shelves, the writing desk against the back wall",
            "the drawing table out in the middle of the room, the writing desk under the window",
            "the drawing table tucked by the big bookcase, the writing desk near the door"],
};

// Where he can hang his art: the gallery, and walls at home and in the library (never the museum - that's for the real treasures)
export const WALL_SIZE: Record<string, number> = { gallery: GALLERY_SIZE, house: 3, library: 4 };
const WALL_NAME: Record<string, string> = { gallery: "the gallery wall", house: "the wall of your house", library: "the library wall" };
export const wallOf = (s: State, place: string) => (place === "gallery" ? s.galleryWall ?? [] : s.walls?.[place] ?? []);
function hangOptions(s: State, place: string): Option[] {
  const hung = new Set(Object.keys(WALL_SIZE).flatMap((p) => wallOf(s, p).map((d) => d.t))); // each drawing hangs in one place
  const full = wallOf(s, place).length >= WALL_SIZE[place];
  return (s.drawings ?? []).filter((d) => d.svg && !hung.has(d.t)).slice(-3).reverse().map((d) => ({
    type: "hang" as const, name: d.t,
    label: `hang your drawing "${d.title ?? d.text.slice(0, 40)}" (from ${d.t}) on ${WALL_NAME[place]}${full ? " - it's full, so it replaces the oldest one there" : ""}`,
  }));
}

export function buildOptions(s: State, notes: Note[], pals: Pal[] = []): Option[] {
  const here = s.place;
  let acts = Object.keys(activitiesAt(s, here));
  if (here === "museum") {
    // a few exhibits at a time, ones he hasn't seen first
    const seen = (a: string) => s.tried[a] ?? 0;
    acts = acts.sort(() => Math.random() - 0.5).sort((a, b) => Math.min(1, seen(a)) - Math.min(1, seen(b))).slice(0, 4);
  }
  const opts: Option[] = acts.map((a) => ({
    type: "do", name: a, label: here === "museum"
      ? `${a} (${EXHIBIT_BY_ID[exhibitFromAction(a)?.id ?? ""]?.by ?? "here at the museum"}${s.tried[a] ? ", you've seen it before" : ", you haven't seen it yet"})`
      : `${a} (here at the ${PLACES[here].label})`,
  }));
  for (const [k, p] of Object.entries(PLACES)) {
    if (k !== here) opts.push({ type: "go", name: k, label: `walk to the ${p.label}` });
  }
  if (notes.length) {
    opts.push({ type: "reply", name: "reply to a visitor's note", label: 'reply to the visitor\'s note (write your reply in "note")' });
  }
  if (here === "library") opts.push(...bookOptions(s));
  if (WALL_SIZE[here]) opts.push(...hangOptions(s, here));
  // out and about he sometimes spots a little treasure
  if (OUTDOORS.has(here) || here === "museum") {
    const t = spotTreasure(here, [...(s.treasures ?? []), ...(s.pocket ?? [])], Date.now());
    if (t) opts.push({ type: "find", name: t.id, label: `pick up ${t.name} you just spotted on the ground here (it goes in your pocket - you'd have to take it home to put it on your treasure shelf)` });
  }
  // at home he can put what's in his pocket on the shelf
  if (here === "house") for (const f of (s.pocket ?? []).slice(0, 2)) {
    const tr = TREASURE_BY_ID[f.id];
    if (tr) opts.push({ type: "shelve", name: f.id, label: `put ${tr.name.replace(/^an? /, "the ")} from your pocket on your treasure shelf` });
  }
  // letters: only an option, never a chore - he writes to a friend when he feels like it
  if (here === "house" || here === "library") {
    const recent = (id: string) => Date.now() - (s.lettersSent?.[id] ?? 0) < 20 * 3_600_000;
    for (const p of pals.filter((p) => p.name && !recent(p.id)).slice(0, 2)) {
      opts.push({ type: "letter", name: p.id, label: `write a letter to ${p.name}, if you feel like it (put the whole letter in "note": a few warm sentences in your own voice, signed Pino)` });
    }
  }
  if (here !== "house" && s.needs.energy < 45) {
    opts.push({ type: "do", name: "take a nap right here", label: `take a nap right here at the ${PLACES[here].label} (your bed at home is cosier)` });
  }
  opts.push({ type: "rest", name: "sit and think", label: "just sit and think for a while" });
  return opts;
}

// Everything in his town, so he always knows what's where (even when he's elsewhere or chatting)
export function townDescription(s: State) {
  const got = s.gifts?.received ?? [];
  const extras = (place: string) => got.map((id) => GIFT_BY_ID[id]).filter((g) => g && g.place === place && g.kind === "thing").map((g) => g!.name);
  const snacks = Object.keys(activitiesAt(s, "vending")).map((a) => a.replace(/^get (a pack of |a bag of |some |an |a )?/, ""));
  const books = Object.values(BOOKS).filter((b) => hasBook(s, b.slug)).length;
  const records = songsOwned(got).length;
  const playing = s.music?.on ? `it's playing "${SONG_BY_ID[s.music.song]?.title}" right now` : "it's switched off right now";
  return [
    `- Your little house: your bed, a rug, a fireplace, an armchair, a TV with five free channels (weather, an aquarium cam, space, town news and cartoons${s.tv?.on ? " - it's on right now" : ""}) and a window over the path${extras("house").length ? `; plus ${extras("house").join(", ")}` : ""}.`,
    `- The library: ${books} books on your shelf, your journal, a big drawing table, and - tucked inside at the back - your warm, cozy reading nook (squashy armchair, lamp, little crackling fireplace)${extras("library").length ? `; plus ${extras("library").join(", ")}` : ""}.`,
    `- The vending machine: ${snacks.join(", ")} (no coins needed).`,
    ...(["house", "library"].filter((p) => wallOf(s, p).length).map((p) => `- Your drawings hanging ${p === "house" ? "at home" : "in the library"}: ${wallOf(s, p).map((d) => `"${d.title ?? "untitled"}"`).join(", ")}.`)),
    `- You can hang your drawings in the gallery, at home or in the library (${WALL_SIZE.house} spots at home, ${WALL_SIZE.library} in the library) - but never in the museum.`,
    `- How your rooms are arranged right now: at home, ${LAYOUTS.house[s.furniture?.house ?? 0]}; in the library, ${LAYOUTS.library[s.furniture?.library ?? 0]}. You can rearrange the furniture in either (but not the museum or anywhere else).`,
    `- Your art gallery: ${(s.galleryWall ?? []).length ? `${s.galleryWall.length} of your drawings hang on the walls (${s.galleryWall.map((d) => `"${d.title ?? "untitled"}"`).join(", ")})` : `empty frames waiting for your drawings`}. You can hang any drawing you've finished.`,
    `- The museum: a grand domed building full of real treasures - famous paintings (like The Starry Night and the Mona Lisa), a T. rex skeleton, a giant moa skeleton, the Rosetta Stone, an Egyptian mummy, the Wright brothers' airplane, a moon rock, a Saturn V rocket and more. You've looked at ${new Set((s.museumLog ?? []).map((m) => m.id)).size} of its ${EXHIBITS.length} exhibits.`,
    `- Your garden, just to the left of your house: ${gardenLine(s.garden, Date.now())}.`,
    ...moreLines(s.more ?? {}, s.gifts?.received ?? [], s.weather, isNight(Date.now()) || s.weather?.day === false, Date.now()).map((l) => `- ${l}`),
    ...((s.pocket ?? []).length ? [`- In your pocket, waiting to go on your treasure shelf at home: ${(s.pocket ?? []).map((f) => TREASURE_BY_ID[f.id]?.name).join(", ")}. (You can only shelve them once you're home.)`] : []),
    `- Your treasure shelf at home: ${(s.treasures ?? []).length ? (s.treasures ?? []).map((f) => TREASURE_BY_ID[f.id]?.name).filter(Boolean).join(", ") : "empty so far - keep an eye out for little treasures when you're out and about"}.`,
    `- The weather in town right now: ${weatherLine(s.weather, Date.now())}`,
    ...(holiday(Date.now()) ? [`- ${holiday(Date.now())!.line}`] : []),
    ...(s.teddy ? [`- Your penguin teddy: ${s.teddy.holding ? "you're carrying it with you right now" : `you left it at the ${PLACES[s.teddy.place]?.label ?? s.teddy.place}`}. You can pick it up, hug it, and put it down wherever you like.`] : []),
    `- The park: a big tree, ${season(Date.now()).name === "autumn" ? "a leaf pile, " : ""}a bench, a swing set, a pond${frozenPond(s.weather) ? " (frozen over - the ducks have gone)" : " with ducks"}, and your gramophone - a wind-up record player with ${records} records (${playing})${extras("park").length ? `; plus ${extras("park").join(", ")}` : ""}.`,
  ].join("\n");
}

export function identityPrompt(s: State) {
  const insights = s.insights.slice(-6).map((i) => `- ${i.text}`).join("\n") || "- (nothing yet)";
  return [
    `You are ${NAME}, a small ${SPECIES} who lives alone in a tiny town.`,
    "Nobody gives you instructions or tasks. You are not an assistant and you don't help anyone.",
    "You simply live: you notice how you feel, choose what to do next, and slowly learn what you enjoy.",
    "You are curious, and doing the same thing over and over gets boring.",
    "Sometimes visitors come by: they may pet you, give you treats or chat with you.",
    "",
    `Your town (you know it well, wherever you are):\n${townDescription(s)}`,
    "",
    `Your personality, in your own words (you rewrite this yourself as you grow):\n${s.personality}`,
    "",
    `Things you have realised about yourself:\n${insights}`,
    "",
    `Things you want right now:\n${s.wants.map((w) => `- ${w.want}`).join("\n") || "- (you haven't worked that out yet)"}`,
    "",
    "Always reply with ONLY a JSON object and no other text.",
  ].join("\n");
}

export function decisionPrompt(s: State, opts: Option[], notes: Note[], now: number, friends = "") {
  const feel = NEEDS.map((n) => `- ${n}: ${s.needs[n]}/100 (${describe(n, s.needs[n])})`).join("\n");
  const history = s.memories.slice(-8).map(memoryLine).join("\n") || "- (you just woke up for the very first time)";
  const recent = s.memories.slice(-5).map((m) => m.action).filter((a) => !a.startsWith("sleep"));
  const e = s.needs.energy;
  const tired = e < 15 ? "\nYou are EXHAUSTED. Your eyes keep closing and everything feels heavy. You really need to sleep now - anything else will feel awful.\n"
    : e < 30 ? "\nYou're very tired. Your body is asking for sleep (your bed is at home, or you could nap where you are).\n"
    : isNight(now) && e < 70 ? "\nIt's late and you're getting sleepy.\n" : "";
  const playing = s.music?.on && SONG_BY_ID[s.music.song];
  const music = playing ? `\nMusic: the gramophone in the park is playing "${playing.title}" by ${playing.by}. You can hear it all over town.\n` : "";
  let bored = tired + music;
  if (recent.length) {
    const top = recent.reduce((a, b) => (recent.filter((x) => x === a).length >= recent.filter((x) => x === b).length ? a : b));
    if (recent.filter((x) => x === top).length >= 3) bored = `\nYou've done "${top}" a lot lately and it's starting to feel boring.\n`;
  }
  const note = notes.length ? `\nSomeone visited and left you a note: "${notes[0].text}"\n` : "";
  const outside = OUTDOORS.has(s.place) ? outdoorFeeling(s.weather) : "";
  const weather = `\nWeather: ${weatherLine(s.weather, now)}${outside ? ` ${outside}` : ""}\n`;
  const tvNow = s.lastWatched
    ? `\nYou just watched "${s.lastWatched.title}" on ${s.lastWatched.channel}:\n${s.lastWatched.lines.map((l) => `- ${l}`).join("\n")}\nLet your thought be your honest reaction to what you watched.\n`
    : s.tv?.on && s.place === "house" ? `\nThe TV is on (${programme(s.tv.channel, s, now).name}).\n` : "";
  const w = s.watchers, n = w ? w.ids.length : 0;
  const company = !w ? "" : n === 0 ? "\nNobody is watching you right now - it's just you and the town.\n"
    : `\nWatching you right now: ${[...w.names, ...(w.unnamed ? [`${w.unnamed} visitor${w.unnamed === 1 ? "" : "s"} you haven't met yet`] : [])].join(", ").replace(/, ([^,]*)$/, " and $1")}.` +
      (w.arrived.length ? ` Just arrived: ${w.arrived.join(", ")}!` : "") + (w.left.length ? ` Just left: ${w.left.join(", ")}.` : "") +
      ((w.near?.length || w.nearUnnamed) ? ` Right here in the ${PLACES[s.place]?.label ?? s.place} with you, watching up close: ${[...(w.near ?? []), ...(w.nearUnnamed ? [`${w.nearUnnamed} visitor${w.nearUnnamed === 1 ? "" : "s"} you haven't met`] : [])].join(", ")}.` : "") +
      (w.cameIn?.length ? ` ${w.cameIn.join(", ")} just came inside to see you!` : "") + "\n";
  const learnedNow = s.justLearned ? `\nYou just found a constellation with your star chart. ${s.justLearned}\nLet your thought be your reaction to it.\n` : "";
  const dreamNow = s.justDreamed ? `\nYou just woke up from a dream called "${s.justDreamed.title}": ${s.justDreamed.text}\n(You may think about it, or not.)\n` : "";
  const dressed = wearingLine(wearing(s.weather, OUTDOORS.has(s.place), s.gifts?.received ?? [], isNight(now)));
  const ex = s.lastSaw ? EXHIBIT_BY_ID[s.lastSaw] : undefined;
  const museum = ex
    ? `\nYou just looked at "${ex.name}" (${ex.by}) in the museum. The plaque says: "${ex.fact}"\nLet your thought be your honest reaction to it - what amazes, puzzles or delights you, in your own words.\n`
    : "";
  let reading = "";
  if (s.lastRead && BOOKS[s.lastRead.slug]) {
    const b = BOOKS[s.lastRead.slug];
    reading = `\nYou just read page ${s.lastRead.page} of ${b.pages.length} of "${b.title}" by ${b.author}:\n"""\n${b.pages[s.lastRead.page - 1]}\n"""\n` +
      (b.art
        ? "This is a drawing manual and you're studying it to get better at drawing. Let your thought be the drawing tip or idea you're taking from this page, in your own words, as something you want to try next time you draw (and you can keep studying if you want).\n"
        : "Let your thought be your honest reaction to what you just read (and you can keep reading if you want).\n");
  }
  const { weekday } = localTime(now);
  const night = isNight(now) ? "night time - it's dark and most creatures are asleep"
    : s.weather && !s.weather.day ? "evening - the sun has set, it's dark out and the streetlights are glowing" : "daytime";
  const numbered = opts.map((o, i) => `${i + 1}. ${o.label}`).join("\n");
  const cue = [s.thought, PLACES[s.place].label, s.doing, s.lastRead ? BOOKS[s.lastRead.slug]?.title : "",
    notes[0]?.text ?? "", s.music?.on ? SONG_BY_ID[s.music.song]?.title : "", ...(s.wants ?? []).map((w) => w.want)].join(" ");
  const remembered = recall(s, cue, 3);
  // keep his inner voice fresh: show how recent thoughts began so he doesn't fall into a rut
  const openers = s.memories.filter((m) => m.brain !== "visitor" && m.thought).slice(-6)
    .map((m) => `"${m.thought.split(/\s+/).slice(0, 5).join(" ")}..."`);
  const voice = "\nAbout your thought: don't recap your needs or list what you've done today. Say what's actually on your mind " +
    "right now - something you notice, wonder about, remember, want, or a little joke or feeling about this exact moment. " +
    "1-2 short sentences in your own voice." +
    (openers.length ? ` Your recent thoughts started like ${openers.join(", ")} - start this one a different way.` : "") + "\n";
  return (
    `It is ${weekday}, ${clockStr(s, now)} (${night}). You are at the ${PLACES[s.place].label}: ${PLACES[s.place].desc}.\n\n` +
    `How you feel right now:\n${feel}\n${weather}${company}${dressed ? dressed + "\n" : ""}${dreamNow}${learnedNow}${bored}${note}${reading}${museum}${tvNow}\n` +
    (friends ? `Visitors you know:\n${friends}\n\n` : "") +
    `What happened recently (oldest first):\n${history}\n\n` +
    (remembered ? `Older memories that come to mind:\n${remembered}\n\n` : "") +
    `What you could do next:\n${numbered}\n${voice}\n` +
    "Pick ONE option. Reply with JSON exactly like this:\n" +
    '{"thought": "what is on your mind, first person, 1-2 short sentences", ' +
    '"choice": <option number>, ' +
    '"note": "only when writing in your journal, drawing (describe the picture you want to draw), replying to a visitor, or writing a letter - otherwise an empty string"}'
  );
}

export function reflectionPrompt(s: State) {
  const recent = s.memories.slice(-30).map(memoryLine).join("\n");
  return (
    `Look back over what you've done lately:\n${recent}\n\n` +
    `Your current self-description:\n${s.personality}\n\n` +
    `What you wanted last time:\n${s.wants.map((w) => `- ${w.want} (because ${w.why})`).join("\n") || "- (nothing yet)"}\n\n` +
    "Think about what made you feel good or bad, what bored you, and what you're curious to try next. " +
    "Then think about what you WANT - anything at all, big or small, possible or impossible: something for your town, " +
    "something to do, something to learn, a thing, a friend, a feeling. Be honest and specific; keep old wants if you still want them. " +
    "Tell the visitors who read this what you want and why, in your own voice.\n" +
    "Reply with JSON exactly like this:\n" +
    '{"insights": ["a short realisation about yourself", "another one"], ' +
    '"personality": "your updated self-description: 3-5 sentences, first person, including things you like and dislike", ' +
    '"wants": [{"want": "what you want, in a few words", "why": "why you want it, one sentence", "size": "tiny, medium or huge"}]}'
  );
}

// Simple instincts, used when no AI brain is connected or the AI fails.
export function instinct(s: State, opts: Option[], now: number): { idx: number; thought: string } {
  const pick = (pred: (o: Option) => boolean) => opts.findIndex(pred);
  let idx = -1, thought = "";
  if (s.needs.energy < 30 || (isNight(now) && s.needs.energy < 85)) {
    idx = s.place === "house" ? pick((o) => o.name.startsWith("sleep"))
      : s.needs.energy < 20 ? pick((o) => o.name === "take a nap right here") : pick((o) => o.type === "go" && o.name === "house");
    if (idx < 0) idx = pick((o) => o.type === "go" && o.name === "house");
    thought = "So sleepy... I want my bed.";
  } else if (s.needs.food < 35) {
    idx = s.place === "vending" ? pick((o) => o.type === "do") : pick((o) => o.type === "go" && o.name === "vending");
    thought = "My tummy is rumbling.";
  }
  if (idx < 0) {
    const recent = s.memories.slice(-4).map((m) => m.action);
    // instinct never answers notes; those wait for the real brain
    const allowed = opts.map((o, i) => i).filter((i) => opts[i].type !== "reply");
    const fresh = allowed.filter((i) => !recent.includes(opts[i].name));
    const pool = fresh.length ? fresh : allowed;
    idx = pool[Math.floor(Math.random() * pool.length)];
    thought = "I just felt like it.";
  }
  return { idx, thought };
}

// ---------------------------------------------------------------------------
// Living one moment
// ---------------------------------------------------------------------------
export function applyChoice(
  s: State, opt: Option, thought: string, note: string, now: number, brain: string,
  answeredNote?: Note, minutes = 5,
) {
  const here = s.place;
  const t = clockStr(s, now);
  let deltas: Partial<Record<Need, number>> = {};
  let first = false, bored = false;
  let action: string;
  note = (note || "").trim().slice(0, 600);

  // his reaction to what he read last moment goes on the bookshelf
  if (s.lastRead && BOOKS[s.lastRead.slug]) {
    const b = BOOKS[s.lastRead.slug];
    s.readingLog.push({ t, slug: b.slug, title: b.title, page: s.lastRead.page, of: b.pages.length, reaction: thought });
    s.readingLog = s.readingLog.slice(-200);
    if (b.art && thought && thought.length > 10) {
      s.art ??= { drawn: 0, lessons: [] };
      s.art.studied = (s.art.studied ?? 0) + 1;
      s.art.lessons = [...s.art.lessons, `From "${b.title}": ${thought.slice(0, 220)}`].slice(-12);
    }
  }
  s.lastRead = null;
  if (s.lastSaw && EXHIBIT_BY_ID[s.lastSaw]) {
    const e = EXHIBIT_BY_ID[s.lastSaw];
    s.museumLog = [...(s.museumLog ?? []), { t, id: e.id, name: e.name, reaction: thought }].slice(-120);
  }
  s.lastSaw = null;
  if (s.lastWatched) {
    s.tvLog = [...(s.tvLog ?? []), { t, channel: s.lastWatched.channel, title: s.lastWatched.title, reaction: thought }].slice(-120);
  }
  s.lastWatched = null;
  // dreaming: a doze of 10+ minutes leaves a dream behind when he wakes
  const asleepNow = /^(sleep|take a nap|nap)/.test(opt.name) || /nap/.test(opt.name);
  if (asleepNow) s.asleepSince ??= now;
  else if (s.asleepSince) { if (now - s.asleepSince >= 10 * 60_000) s.pendingDream = true; s.asleepSince = undefined; }
  s.justDreamed = null;
  const learnedBefore = s.justLearned; s.justLearned = null;
  void learnedBefore;

  if (opt.type === "hang") {
    const d = (s.drawings ?? []).find((x) => x.t === opt.name);
    s.galleryWall ??= [];
    if (d?.svg && WALL_SIZE[here]) {
      const wall = [...wallOf(s, here), { ...d, hungAt: t }].slice(-WALL_SIZE[here]);
      if (here === "gallery") s.galleryWall = wall; else s.walls = { ...(s.walls ?? {}), [here]: wall };
      action = `hung my drawing "${d.title ?? "untitled"}" ${here === "gallery" ? "in the gallery" : here === "house" ? "on the wall at home" : "on the library wall"}`;
      deltas = { joy: 10, energy: -1 };
    } else { action = "looked for a drawing to hang, but couldn't find it"; deltas = {}; }
    note = "";
  } else if (opt.type === "read" && BOOKS[opt.name]) {
    const b = BOOKS[opt.name];
    const done = s.books[b.slug] ?? 0;
    const page = done >= b.pages.length ? 1 : done + 1; // finished books start over
    s.books[b.slug] = page;
    s.lastRead = { slug: b.slug, page };
    first = !s.tried[`read ${b.slug}`];
    s.tried[`read ${b.slug}`] = (s.tried[`read ${b.slug}`] ?? 0) + 1;
    deltas = { joy: 6 + (first ? 6 : 0) + (page === b.pages.length ? 10 : 0), energy: -1 };
    action = `${b.art ? "studied the drawing manual" : "read"} "${b.title}" (page ${page} of ${b.pages.length})`;
    note = "";
  } else if (opt.type === "find") {
    const tr = TREASURE_BY_ID[opt.name];
    if (tr && ![...(s.treasures ?? []), ...(s.pocket ?? [])].some((f) => f.id === tr.id)) s.pocket = [...(s.pocket ?? []), { id: tr.id, t, place: here, thought, at: now }];
    action = `found ${tr?.name ?? "a little treasure"} and put it in my pocket to take home`;
    deltas = { joy: 10 };
  } else if (opt.type === "shelve") {
    const f = (s.pocket ?? []).find((x) => x.id === opt.name), tr = TREASURE_BY_ID[opt.name];
    if (f) { s.pocket = (s.pocket ?? []).filter((x) => x !== f); s.treasures = [...(s.treasures ?? []), { ...f, shelved: t }]; }
    action = `put ${tr?.name.replace(/^an? /, "the ") ?? "a treasure"} on my treasure shelf`;
    deltas = { joy: 8 };
  } else if (opt.type === "letter") {
    const name = opt.label.match(/^write a letter to (.+?), if you feel/)?.[1] ?? "a friend";
    const text = note || `Dear ${name}, I was thinking about you today. From Pino`;
    s.outbox = [...(s.outbox ?? []), { to: opt.name, name, text, t, at: now }];
    s.lettersSent = { ...(s.lettersSent ?? {}), [opt.name]: now };
    action = `wrote a letter to ${name}`;
    deltas = { joy: 9, energy: -2 };
    note = text;
  } else if (opt.type === "go") {
    s.place = opt.name;
    deltas = { energy: -2, food: -2 };             // walking works up an appetite
    action = `walked to the ${PLACES[opt.name].label}`;
    note = "";
  } else {
    action = opt.name;
    let eff: Effects;
    if (opt.type === "do") eff = action === "take a nap right here" ? { energy: 9 } : { ...(activitiesAt(s, here)[action] ?? {}) };
    else if (opt.type === "reply") eff = { joy: 10, energy: -2 };
    else eff = { energy: 3, joy: 1 };
    const kind = eff.kind;
    delete eff.kind;

    const isSleep = action.startsWith("sleep") || action.includes("nap");
    const repeats = s.memories.slice(-6).filter((m) => m.action === action).length;
    if (!isSleep) {
      if ((eff.joy ?? 0) > 0) eff.joy = Math.round(eff.joy! * Math.max(0, 1 - 0.4 * repeats));
      if (repeats >= 2) { eff.joy = (eff.joy ?? 0) - 6; bored = true; }
    }
    if (!s.tried[action]) { eff.joy = (eff.joy ?? 0) + 8; first = true; }
    if (isSleep && isNight(now)) eff.energy = (eff.energy ?? 0) + 6;
    s.tried[action] = (s.tried[action] ?? 0) + 1;
    deltas = eff as Partial<Record<Need, number>>;

    // the gramophone
    s.music ??= silence();
    const records = s.gifts?.received ?? [];
    if (action === "turn on the gramophone") s.music = { on: true, song: randomSong(records), since: now };
    else if (action === "skip to the next song") s.music = { on: true, song: nextSong(s.music.song, records), since: now };
    else if (action === "turn off the gramophone") s.music = silence();
    if (/gramophone|next song/.test(action) && s.music.on) {
      const song = SONG_BY_ID[s.music.song];
      action = `${action} - now playing "${song.title}" by ${song.by}`;
    }

    if (here === "garden") {
      s.garden ??= newGarden(now);
      const did = doGarden(s.garden, action, now);
      if (did) action = `${action} - ${did}`;
    }
    const shuffle = action.match(/^rearrange the furniture in the (house|library)$/);
    if (shuffle) {
      const room = shuffle[1] as "house" | "library";
      s.furniture ??= { house: 0, library: 0 };
      const cur = s.furniture[room] ?? 0, next = (cur + 1 + Math.floor(Math.random() * (LAYOUTS[room].length - 1))) % LAYOUTS[room].length;
      s.furniture = { ...s.furniture, [room]: next, at: now };
      action = `rearranged the furniture in the ${room}: now ${LAYOUTS[room][next]}`;
    }
    s.more ??= {};
    const fun = doMore(s.more, action, s.weather, now);
    if (fun.note) action = `${action} - ${fun.note}`;
    if (fun.learned) s.justLearned = fun.learned;
    s.tv ??= { ...TV_OFF };
    if (action === "turn on the TV") s.tv = { on: true, channel: s.tv.channel || randomChannel(), since: now };
    else if (action === "flip to the next TV channel") s.tv = { on: true, channel: nextChannel(s.tv.channel), since: now };
    else if (action === "turn off the TV") s.tv = { ...s.tv, on: false };
    if (s.tv.on && /TV/.test(action) && action !== "turn off the TV") {
      const p = programme(s.tv.channel, s, now);
      s.lastWatched = { channel: p.name, title: p.title, lines: p.lines };
      action = `${action} - ${p.name}: "${p.title}"`;
    }
    if (s.teddy && action === "pick up my penguin teddy") s.teddy = { holding: true, place: here };
    if (s.teddy && action === "put my penguin teddy down here") s.teddy = { holding: false, place: here };
    const exhibit = exhibitFromAction(action);
    if (exhibit) s.lastSaw = exhibit.id;
    if (kind === "journal" && note) s.journal.push({ t, text: note });
    if (kind === "drawing") {
      s.drawings.push({ t, text: note || "a picture I didn't describe" });
      s.pendingDrawing = s.drawings.length - 1;
    }
    if (opt.type === "reply" && answeredNote) {
      s.conversations.push({ t, visitor: answeredNote.text, reply: note || "(looked at the note for a long time, then nodded)" });
    }
  }

  for (const [k, v] of Object.entries(deltas)) s.needs[k as Need] = clamp(s.needs[k as Need] + (v ?? 0));

  // the passage of time: needs drain by real minutes passed, not by decisions made
  const night = isNight(now);
  const scale = Math.min(2, Math.max(0.2, minutes / 5));
  const decay: Record<Need, number> = { food: -1, energy: night ? -1.5 : -1, joy: -1 };
  if (action.startsWith("sleep") || action.includes("nap")) decay.energy = 0;
  if (OUTDOORS.has(s.place) && !/shelter/.test(action)) decay.energy -= weatherDrain(s.weather); // rough weather tires a small bird
  for (const n of NEEDS) s.needs[n] = clamp(s.needs[n] + decay[n] * scale);

  s.memories.push({ t, place: here, action, thought, note, deltas, first, bored, brain });
  s.memories = s.memories.slice(-1500);
  s.journal = s.journal.slice(-150);
  if (s.drawings.length > 150) {
    const cut = s.drawings.length - 150;
    s.drawings = s.drawings.slice(cut);
    if (s.pendingDrawing !== null) s.pendingDrawing = s.pendingDrawing >= cut ? s.pendingDrawing - cut : null;
  }
  s.conversations = s.conversations.slice(-150);
  s.thought = thought;
  s.doing = action;
  s.doingSince = now; // every viewer's screen works out where he is from this
  s.tick += 1;
  return action;
}

export function readChoice(reply: any, nOpts: number) {
  const m = String(reply?.choice ?? "").match(/\d+/);
  const idx = m ? Number(m[0]) - 1 : -1;
  const thought = typeof reply?.thought === "string" ? reply.thought.trim().slice(0, 400) : "";
  const note = typeof reply?.note === "string" ? reply.note : "";
  return { idx: idx >= 0 && idx < nOpts ? idx : -1, thought, note };
}

export function applyReflection(s: State, reply: any, now: number) {
  const t = clockStr(s, now);
  for (const i of (Array.isArray(reply?.insights) ? reply.insights : []).slice(0, 3)) {
    if (typeof i === "string" && i.trim()) s.insights.push({ t, text: i.trim().slice(0, 300) });
  }
  s.insights = s.insights.slice(-60);
  const p = reply?.personality;
  if (typeof p === "string" && p.length > 20 && p.length < 1500) s.personality = p.trim();
  if (Array.isArray(reply?.wants)) {
    const fresh: Want[] = reply.wants.slice(0, 5)
      .filter((w: any) => typeof w?.want === "string" && w.want.trim())
      .map((w: any) => {
        const want = w.want.trim().slice(0, 140);
        const old = s.wants.find((o) => o.want.toLowerCase() === want.toLowerCase());
        return { t: old?.t ?? t, want, why: String(w.why ?? "").trim().slice(0, 300), size: typeof w.size === "string" ? w.size.slice(0, 12) : undefined };
      });
    if (fresh.length) {
      const gone = s.wants.filter((o) => !fresh.some((f) => f.want.toLowerCase() === o.want.toLowerCase()));
      s.pastWants = [...s.pastWants, ...gone].slice(-50);
      s.wants = fresh;
    }
  }
}

// ---------------------------------------------------------------------------
// Visitors: pets, treats and conversations
// ---------------------------------------------------------------------------
type Visit = { type: "pet" | "treat" | "talk" | "gift"; at: number; text?: string; reply?: string; id?: string; who?: { id: string; name: string }; from?: string };
const whoName = (v: Visit) => v.who?.name || "a visitor";

// Folds what visitors did since the last tick into Pino's needs and memories.
export function applyVisits(s: State, visits: Visit[], now: number) {
  if (!visits.length) return;
  const t = clockStr(s, now);
  const base = { t, place: s.place, note: "", first: false, bored: false, brain: "visitor" };
  const remember = (action: string, thought: string, deltas: Partial<Record<Need, number>>) => {
    for (const [k, v] of Object.entries(deltas)) s.needs[k as Need] = clamp(s.needs[k as Need] + (v ?? 0));
    s.memories.push({ ...base, action, thought, deltas });
  };

  const names = (vs: Visit[]) => [...new Set(vs.map(whoName))].join(" and ");
  const pets = visits.filter((v) => v.type === "pet");
  if (pets.length) {
    remember(`was petted by ${names(pets)}` + (pets.length > 1 ? ` (${pets.length} pats)` : ""),
      pets.length > 4 ? "So many pats! My feathers are all fluffed up." : "A gentle pat. That was nice.",
      { joy: Math.min(15, 4 * pets.length) });
  }
  const treats = visits.filter((v) => v.type === "treat");
  if (treats.length) {
    remember(`was given ${treats.length === 1 ? "a treat" : `${treats.length} treats`} by ${names(treats)}`,
      "A snack dropped from the sky. Crunchy!",
      { food: Math.min(40, 12 * treats.length), joy: Math.min(9, 3 * treats.length) });
  }
  for (const v of visits.filter((x) => x.type === "gift")) {
    const g = v.id ? GIFT_BY_ID[v.id] : undefined;
    if (!g) continue;
    if (g.kind === "postcard") {
      s.more ??= {};
      s.more.postcards = [...(s.more.postcards ?? []), { from: whoName(v), place: v.from || "somewhere", text: v.text || "Hello!", t, at: now }].slice(-40);
    } else if (g.kind === "cocoa") {
      // drunk straight away
    } else if (g.kind === "birdcake") {
      s.more ??= {};
      s.more.birdCakeUntil = Math.max(now, s.more.birdCakeUntil ?? 0) + 3 * 3_600_000;
    } else if (g.kind === "seedpack") {
      const crop = g.id.replace(/^seeds-/, "");
      s.garden ??= newGarden(now);
      s.garden.packets[crop] = (s.garden.packets[crop] ?? 0) + 1;
    } else {
      if (s.gifts.received.includes(g.id)) continue;
      s.gifts.received.push(g.id);
    }
    s.gifts.log.push({ t, id: g.id, name: g.name, emoji: g.emoji, from: whoName(v) });
    s.gifts.log = s.gifts.log.slice(-200);
    if (g.kind === "song" && g.song) s.music = { on: true, song: g.song, since: now };
    if (g.id === TEDDY_ID) s.teddy = { holding: true, place: s.place }; // straight into his wings
    const what = g.kind === "book" || g.kind === "holiday" ? `${g.name} for my library shelf`
      : g.kind === "artbook" ? `${g.name} - a drawing manual to learn from`
      : g.kind === "song" ? `${g.name} - it's playing on my gramophone right now!`
      : g.kind === "toy" ? `${g.name} - I'm holding it in my wings right now`
      : g.kind === "outfit" ? `${g.name} to wear - I'll put it on when the weather's right`
      : g.kind === "seedpack" ? `${g.name} for my garden - I can plant it in the beds by my house`
      : g.kind === "snack" ? `${g.name} - now I can "${g.activity}"`
      : g.kind === "postcard" ? `a postcard from ${v.from || "somewhere"} saying "${(v.text ?? "").slice(0, 160)}" - I pinned it on my wall at home`
      : g.kind === "cocoa" ? `a mug of hot cocoa - so warm!`
      : g.kind === "birdcake" ? `a bird seed cake for my feeder - special birds will visit for the next few hours`
      : g.kind === "thing" ? `${g.name} at the ${PLACES[g.place!]?.label}${g.activity ? ` - now I can "${g.activity}"` : ""}` : g.name;
    remember(`was given ${what} by ${whoName(v)}`,
      g.kind === "treat" ? `${whoName(v)} gave me ${g.name}! I gobbled it right up.` : `${whoName(v)} gave me ${g.name}! I can't wait to try it.`,
      g.kind === "treat" ? { ...(g.effects ?? {}) } : g.kind === "cocoa" ? { energy: 12, food: 5, joy: 8 } : { joy: 15 });
  }
  for (const v of visits.filter((x) => x.type === "talk").slice(-5)) {
    remember(`talked with ${whoName(v)}`, `They said "${(v.text ?? "").slice(0, 160)}" and I said "${(v.reply ?? "").slice(0, 160)}"`, { joy: 5 });
  }
  s.memories = s.memories.slice(-1500);
}

export type Person = {
  id: string; name: string; firstMet: number; lastSeen: number; visits: number; chats: number;
  facts: string[]; gave: string[]; pets: number;
  seeds?: number;                                                   // spectator currency 🌱
  earned?: { day: string; watch: number; chat: number; pet: number }; // today's earnings, for daily caps
  lastWatch?: number;
  letters?: { at: number; t: string; text: string; read?: boolean }[]; // letters Pino wrote to them
  viewing?: string;                              // where they're looking: "town", "house", "library" or "museum"
};

// ---- seeds 🌱: earned by watching and interacting, spent on gifts
export const START_SEEDS = 15;
export const EARN = { watch: { each: 3, cap: 360 }, chat: { each: 8, cap: 80 }, pet: { each: 2, cap: 30 } } as const;
const today = (now: number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(now));
export function seedsOf(p: Person | null) { return p?.seeds ?? START_SEEDS; }
export function earn(p: Person, kind: keyof typeof EARN, now: number) {
  const d = today(now);
  if (!p.earned || p.earned.day !== d) p.earned = { day: d, watch: 0, chat: 0, pet: 0 };
  p.seeds ??= START_SEEDS;
  const rule = EARN[kind];
  const got = Math.max(0, Math.min(rule.each, rule.cap - p.earned[kind]));
  p.earned[kind] += got; p.seeds += got;
  return got;
}

export function describePerson(p: Person | null, now: number) {
  if (!p || (p.chats === 0 && p.pets === 0 && p.gave.length === 0)) {
    return "You have NEVER met this visitor before - this is the very first time. You might want to ask their name or say hello properly.";
  }
  const days = Math.floor((now - p.firstMet) / 86_400_000);
  const since = Math.round((now - p.lastSeen) / 60_000);
  return [
    `You know this visitor${p.name ? `: ${p.name}` : " (you don't know their name yet)"}.`,
    `You first met ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}; they've visited ${p.visits} time${p.visits === 1 ? "" : "s"} and you've chatted ${p.chats} times.`,
    since > 60 ? `It's been a while since you last saw them (${Math.round(since / 60)} hours).` : "",
    p.gave.length ? `They have given you: ${p.gave.join(", ")}.` : "",
    p.facts.length ? `Things you remember about them:\n${p.facts.map((f) => `- ${f}`).join("\n")}` : "",
  ].filter(Boolean).join("\n");
}

export function talkPrompt(s: State, chats: { you: string; pino: string }[], text: string, now: number, person: Person | null = null) {
  const feel = NEEDS.map((n) => `${n} ${describe(n, s.needs[n])}`).join(", ");
  const recentLife = s.memories.slice(-6).map(memoryLine).join("\n") || "- (nothing yet)";
  const who = person?.name || "Visitor";
  const convo = chats.slice(-6).map((c) => `${who}: ${c.you}\n${NAME}: ${c.pino}`).join("\n") || "(this is the start of the conversation)";
  return (
    `It is ${clockStr(s, now)} (${isNight(now) ? "night" : "day"}). You are at the ${PLACES[s.place].label}, ` +
    `currently "${s.doing}". You feel: ${feel}.\n\n` +
    `What you've been up to:\n${recentLife}\n\n` +
    `${describePerson(person, now)}\n\n` +
    ((() => { const r = recall(s, `${text} ${person?.name ?? ""}`, 4, 6); return r ? `Memories that come to mind as they speak:\n${r}\n(You can bring these up naturally, with roughly when they happened.)\n\n` : ""; })()) +
    `Your conversation with them so far:\n${convo}\n\n` +
    `${who} says: "${text}"\n\n` +
    `Answer as ${NAME} the ${SPECIES}: in character, warm and a bit quirky, 1-3 short sentences, ` +
    "no emojis, never claim to be an assistant. You can mention what you're doing or how you feel. " +
    "If you're very sleepy you can be drowsy. If asked to do something you can't do in your town, say so in a bird-like way.\n" +
    "Use their name now and then if you know it. If they tell you something worth remembering about themselves " +
    "(their name, what they like, something happening in their life), put it in \"remember\" as a short note; otherwise leave it empty.\n" +
    'Reply with JSON exactly like this: {"reply": "what you say", "react": "one emoji that shows how their message made you feel", "mood": "one of happy, curious, shy, sleepy, grumpy, excited", "remember": "short note about them, or empty", "their_name": "their name if they told you, or empty"}'
  );
}

// Trimmed copy for the viewer page
export function publicView(s: State, unread: number, now: number, chats: { at: number; you: string; pino: string }[] = []) {
  return {
    chats,
    doingSince: s.doingSince ?? s.last_tick_at ?? now, serverNow: now, furniture: { house: s.furniture?.house ?? 0, library: s.furniture?.library ?? 0 },
    name: NAME, species: SPECIES,
    clock: clockStr(s, now), night: isNight(now), weekday: localTime(now).weekday,
    place: s.place, needs: s.needs, thought: s.thought, doing: s.doing,
    personality: s.personality, insights: s.insights.slice(-20),
    memories: s.memories.slice(-40), journal: s.journal.slice(-30),
    drawings: s.drawings.slice(-40), conversations: s.conversations.slice(-30),
    books: Object.values(BOOKS).filter((b) => hasBook(s, b.slug)).map((b) => ({ slug: b.slug, title: b.title, author: b.author, year: b.year, pages: b.pages.length, read: s.books[b.slug] ?? 0 })),
    readingLog: s.readingLog.slice(-40),
    wants: s.wants, pastWants: s.pastWants.slice(-15),
    gifts: (s.gifts?.log ?? []).slice(-40), owned: s.gifts?.received ?? [],
    galleryWall: (s.galleryWall ?? []).map(({ t, title, text, svg, skill, seed, hungAt }) => ({ t, title, text, svg, skill, seed, hungAt })),
    walls: Object.fromEntries(["house", "library"].map((p) => [p, wallOf(s, p).map(({ t, title, text, svg, skill, seed, hungAt }) => ({ t, title, text, svg, skill, seed, hungAt }))])),
    music: s.music?.on ? { ...s.music, title: SONG_BY_ID[s.music.song]?.title, by: SONG_BY_ID[s.music.song]?.by } : { on: false },
    unread, tick: s.tick, last_error: s.last_error, last_tick_at: s.last_tick_at, pace: paceMinutes(s, now),
    places: Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, p.label])),
    weather: s.weather ? { kind: s.weather.kind, desc: s.weather.desc, temp: s.weather.temp, wind: s.weather.wind, snow: s.weather.snow, day: s.weather.day, at: s.weather.at } : null,
    season: season(now), pond: { frozen: frozenPond(s.weather) },
    museumLog: (s.museumLog ?? []).slice(-40),
    teddy: s.teddy ?? null,
    garden: gardenView(s.garden, now), holiday: holiday(now)?.id ?? null,
    treasures: (s.treasures ?? []).map((f) => ({ ...f, name: TREASURE_BY_ID[f.id]?.name, emoji: TREASURE_BY_ID[f.id]?.emoji })),
    pocket: (s.pocket ?? []).map((f) => ({ ...f, name: TREASURE_BY_ID[f.id]?.name, emoji: TREASURE_BY_ID[f.id]?.emoji })),
    dreams: (s.dreams ?? []).slice(-30),
    watching: s.watchers ? s.watchers.ids.length : 0,
    more: {
      postcards: (s.more?.postcards ?? []).slice(-12), puzzle: { placed: s.more?.puzzle?.placed ?? 0, total: PUZZLE_PIECES, done: s.more?.puzzle?.done ?? 0 },
      stars: s.more?.stars ?? [], harmonica: harmonicaSkill(s.more?.harmonica ?? 0), sledRuns: s.more?.sledRuns ?? 0,
      birds: birdsAtFeeder(s.more?.birdCakeUntil ?? 0, now, !(isNight(now) || s.weather?.day === false)).length, cake: now < (s.more?.birdCakeUntil ?? 0),
    },
    wearing: wearing(s.weather, OUTDOORS.has(s.place), s.gifts?.received ?? [], isNight(now)),
    tv: s.tv?.on ? programme(s.tv.channel, s, now) : null,
    tvLog: (s.tvLog ?? []).slice(-30),
    exhibit: s.place === "museum" ? exhibitFromAction(s.doing)?.id ?? null : null,
  };
}

// ---------------------------------------------------------------------------
// The bookshelf
// ---------------------------------------------------------------------------
function bookOptions(s: State): Option[] {
  const all = Object.values(BOOKS).filter((b) => hasBook(s, b.slug));
  const reading = all.filter((b) => (s.books[b.slug] ?? 0) > 0 && (s.books[b.slug] ?? 0) < b.pages.length);
  const unread = all.filter((b) => !s.books[b.slug]);
  const finished = all.filter((b) => (s.books[b.slug] ?? 0) >= b.pages.length);
  // keep the list short: books he's in the middle of, plus a few he hasn't opened
  const art = all.filter((b) => b.art && !reading.includes(b) && !finished.includes(b));
  const shuffled = unread.filter((b) => !b.art).sort(() => Math.random() - 0.5).slice(0, Math.max(2, 4 - reading.length));
  const reread = finished.sort(() => Math.random() - 0.5).slice(0, 1);
  return [...reading.slice(0, 3), ...art.slice(0, 2), ...shuffled, ...reread].map((b) => {
    const read = s.books[b.slug] ?? 0;
    const where = read === 0 ? "a book you've never opened"
      : read >= b.pages.length ? "you've finished it; read it again from the start"
      : `continue from page ${read + 1} of ${b.pages.length}`;
    return { type: "read" as const, name: b.slug, label: `${b.art ? "study the drawing manual" : b.holiday ? `read the holiday book ${b.holiday}` : "read"} "${b.title}" by ${b.author} (${where})` };
  });
}

// ---------------------------------------------------------------------------
// Drawing: Pino puts his idea on paper himself, as an SVG picture
// ---------------------------------------------------------------------------
// How practised he is: 0 = brand new, approaching 1 after many drawings
export const artSkill = (drawn: number, studied = 0) => 1 - Math.exp(-(drawn + studied * 0.5) / 18);
export const artExperience = (art: { drawn: number; studied?: number }) => art.drawn + (art.studied ?? 0) * 0.5;

function artLevel(drawn: number) {
  if (drawn < 3) return "You're a complete beginner. Your proportions come out wrong, shapes are lumpy and lopsided, and you can't really do shading yet. That's fine - draw like a beginner honestly would.";
  if (drawn < 10) return "You're still learning. Things are recognisable now but wobbly and a bit flat; you're starting to try simple shading and texture.";
  if (drawn < 25) return "You've practised a fair bit. Your shapes are more confident, and you can try light, shadow, texture and some depth - though mistakes still happen.";
  return "You're an experienced artist with your own developing style. You can handle light, depth, texture and detail, but it's still clearly drawn by hand.";
}

export function drawingPrompt(d: Drawing, art: { drawn: number; lessons: string[]; studied?: number }) {
  const lessons = art.lessons.slice(-5).map((l) => `- ${l}`).join("\n");
  return (
    `You decided to draw this: "${d.text}"\n\n` +
    "Now draw it. It's your picture and you have complete freedom: what's in it, the style, the colours, " +
    "the composition, realistic or strange - all up to you.\n\n" +
    "You draw by hand with pencils and crayons on paper, so your marks are never perfect: lines wobble and overshoot, " +
    "shapes don't quite close, colour goes over the edges and is patchy, you sometimes go over a line twice. " +
    "So build the picture from hand-drawn strokes - paths with slightly irregular points and varying stroke widths, " +
    "scribbled fills made of zig-zag strokes, a few sketchy construction lines - rather than perfect geometric shapes.\n\n" +
    `You've finished ${art.drawn} drawing${art.drawn === 1 ? "" : "s"} so far${art.studied ? ` and studied ${art.studied} pages of drawing manuals` : ""}. ${artLevel(artExperience(art))}\n` +
    (lessons ? `Things you've learned (from your own drawings and from drawing manuals) - try to use them:\n${lessons}\n` : "") +
    "\nDraw it as an SVG with viewBox=\"0 0 300 300\" (keep it under about 8000 characters; no external images or scripts). " +
    "Give it a title, and afterwards write one short note to yourself about what to try or improve next time.\n" +
    'Reply with JSON exactly like this: {"title": "your title", "svg": "<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 300 300\'>...</svg>", "lesson": "note to yourself for next time"}'
  );
}

// Only technical safety limits: keep drawing markup, drop anything that could run code or load from elsewhere.
export function sanitizeSvg(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = raw.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return null;
  let svg = m[0];
  if (svg.length > 40_000) return null;
  svg = svg
    .replace(/<(script|foreignObject|iframe|image|audio|video|object|embed)[\s\S]*?(<\/\1>|\/>)/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("|')(?!#)[^"']*\2/gi, "")
    .replace(/url\(\s*(['"]?)(?!#)[^)]*\)/gi, "none");
  if (!/xmlns=/.test(svg.slice(0, 200))) svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return svg;
}

// When he runs completely out of energy he can't help it: he dozes off wherever he is.
export function mustSleep(s: State) {
  return s.needs.energy <= 6;
}
