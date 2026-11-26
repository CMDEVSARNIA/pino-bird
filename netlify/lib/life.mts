// Pino's inner life: moods that linger, friendships that deepen, goals he sets himself,
// and favourites that form from what has actually made him happiest.

// ---------------------------------------------------------------- moods
export type Mood = { id: string; why: string; since: number };
export const MOODS: Record<string, { emoji: string; word: string; joyDrift: number }> = {
  proud: { emoji: "🥹", word: "proud", joyDrift: 0.5 },
  delighted: { emoji: "🤩", word: "delighted", joyDrift: 0.5 },
  cheerful: { emoji: "😊", word: "cheerful", joyDrift: 0.4 },
  cosy: { emoji: "☕", word: "cosy", joyDrift: 0.3 },
  curious: { emoji: "🤔", word: "curious", joyDrift: 0.2 },
  content: { emoji: "🙂", word: "content", joyDrift: 0 },
  sleepy: { emoji: "🥱", word: "sleepy", joyDrift: -0.2 },
  grumpy: { emoji: "😤", word: "grumpy", joyDrift: -0.4 },
  lonely: { emoji: "🥺", word: "lonely", joyDrift: -0.5 },
};
export type MoodCtx = {
  now: number; night: boolean; outdoors: boolean; wetOut: boolean; umbrella: boolean; sunnyOut: boolean; coldOrDark: boolean;
  energy: number; joy: number; company: boolean; lastCompany: number; arrived: string[]; giftJustNow: string | null;
  proudOf: string | null; curiousNow: boolean; recentWetOutside: number;
};
const LINGER = 45 * 60_000;
// Works out his mood. A strong mood lingers for a while instead of flipping every moment.
export function nextMood(cur: Mood | undefined, c: MoodCtx): Mood {
  const hoursAlone = (c.now - (c.lastCompany || c.now)) / 3_600_000;
  const pick = (): [string, string] => {
    if (c.proudOf) return ["proud", c.proudOf];
    if (c.giftJustNow) return ["delighted", `someone just gave you ${c.giftJustNow}`];
    if (c.arrived.length) return ["delighted", `${c.arrived.join(" and ")} just came to see you`];
    if (c.wetOut && !c.umbrella && c.recentWetOutside >= 2) return ["grumpy", "your feathers are soggy from being out in the wet"];
    if (!c.company && !c.night && hoursAlone >= 6) return ["lonely", `nobody has come by in about ${Math.round(hoursAlone)} hours`];
    if (c.energy < 22) return ["sleepy", "you're running low on energy"];
    if (c.sunnyOut) return ["cheerful", "it's a bright, sunny day out"];
    if (c.curiousNow) return ["curious", "you've got questions buzzing in your head"];
    if (!c.outdoors && c.coldOrDark) return ["cosy", "you're tucked up indoors while it's cold or dark outside"];
    if (c.joy >= 80) return ["cheerful", "things have been going nicely"];
    return ["content", "nothing much is bothering you"];
  };
  const [id, why] = pick();
  if (!cur) return { id, why, since: c.now };
  if (id === cur.id) return { ...cur, why };
  // loneliness only lifts when someone comes; other strong moods linger before fading to "content"
  if (cur.id === "lonely" && !c.company && !c.arrived.length && !c.giftJustNow) return cur;
  if (id === "content" && cur.id !== "content" && c.now - cur.since < LINGER) return cur;
  return { id, why, since: c.now };
}
export const moodLine = (m: Mood | undefined, now: number) => {
  if (!m) return "";
  const mins = Math.round((now - m.since) / 60_000);
  return `Your mood: ${MOODS[m.id]?.word ?? m.id} (${m.why})${mins >= 20 ? ` - you've felt this way for ${mins >= 90 ? `about ${Math.round(mins / 60)} hours` : `${mins} minutes`}` : ""}. ` +
    "Moods linger and colour how you see things. You can lift a low mood by doing something you love, or just let it be.";
};

// ---------------------------------------------------------------- friendships
export type Bondish = { visits: number; chats: number; pets: number; gave: string[] };
export const bondOf = (p: Bondish) => Math.round(p.visits * 2 + p.chats * 3 + p.pets * 0.5 + (p.gave?.length ?? 0) * 5);
const BONDS: [number, string][] = [[0, "someone you've just met"], [6, "a new friend"], [20, "a friend"], [60, "a good friend"], [150, "a close friend"], [300, "one of your best friends"]];
export const bondLabel = (bond: number) => { let l = BONDS[0][1]; for (const [at, name] of BONDS) if (bond >= at) l = name; return l; };
export const missesThem = (bond: number, lastSeen: number, now: number) => bond >= 20 && now - lastSeen > 2 * 86_400_000;

// what someone likes to talk about: count the meaningful words in what they say to him
const STOP = new Set("the a an and or but of to in on at for with from by is are was were be been it its this that i me my you your he she they we our us his her them so just very really then than too can could would should will about into what when where who how why all any some more most much many one two not no yes do did does have has had get got like hi hello hey pino ok okay thanks thank please oh lol yeah".split(" "));
export function noteTopics(topics: Record<string, number> | undefined, text: string) {
  const out = { ...(topics ?? {}) };
  for (const w of text.toLowerCase().replace(/[^a-z' ]+/g, " ").split(/\s+/)) {
    const t = w.replace(/'s?$/, "");
    if (t.length >= 4 && !STOP.has(t)) out[t] = (out[t] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]).slice(0, 25));
}
export const topTopics = (topics: Record<string, number> | undefined, n = 4) =>
  Object.entries(topics ?? {}).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, n).map(([t]) => t);

// ---------------------------------------------------------------- goals
export type Goal = { goal: string; why: string; set: string; at: number; done?: string; doneAt?: number };
export function applyGoals(goals: Goal[] | undefined, reply: any, t: string, now: number): { goals: Goal[]; finished: string[] } {
  let list = [...(goals ?? [])];
  const finished: string[] = [];
  for (const f of Array.isArray(reply?.finished) ? reply.finished : []) {
    if (typeof f !== "string") continue;
    const g = list.find((x) => !x.done && (x.goal.toLowerCase() === f.toLowerCase().trim() || f.toLowerCase().includes(x.goal.toLowerCase().slice(0, 18))));
    if (g) { g.done = t; g.doneAt = now; finished.push(g.goal); }
  }
  for (const g of Array.isArray(reply?.goals) ? reply.goals : []) {
    const goal = typeof g?.goal === "string" ? g.goal.trim().slice(0, 120) : "";
    if (!goal || list.some((x) => x.goal.toLowerCase() === goal.toLowerCase())) continue;
    if (list.filter((x) => !x.done).length >= 3) break;          // at most three projects on the go
    list.push({ goal, why: String(g.why ?? "").trim().slice(0, 240), set: t, at: now });
  }
  list = [...list.filter((x) => !x.done), ...list.filter((x) => x.done).slice(-20)];
  return { goals: list, finished };
}
export const goalLines = (goals: Goal[] | undefined, now: number) => {
  const open = (goals ?? []).filter((g) => !g.done);
  const done = (goals ?? []).filter((g) => g.done).slice(-3);
  if (!open.length && !done.length) return "";
  return "Your goals (long projects you set for yourself - work on them whenever you feel like it):\n" +
    (open.map((g) => `- ${g.goal} (set ${Math.max(0, Math.round((now - g.at) / 86_400_000))} days ago)`).join("\n") || "- (none right now)") +
    (done.length ? `\nGoals you've achieved: ${done.map((g) => g.goal).join("; ")}` : "");
};

// ---------------------------------------------------------------- favourites
export type Favs = Record<string, string>;
type Mem = { place: string; action: string; deltas: { joy?: number } };
export const FAV_KINDS: Record<string, string> = { book: "book", song: "song", snack: "snack", activity: "thing to do", place: "place" };
// His favourites come from what has actually made him happiest (average joy), not from what he says.
export function favourites(mems: Mem[], places: Record<string, { label: string }>): Favs {
  const tally: Record<string, Record<string, number[]>> = { book: {}, song: {}, snack: {}, activity: {}, place: {} };
  const add = (k: string, name: string, joy: number) => ((tally[k][name] ??= []).push(joy));
  for (const m of mems) {
    const joy = m.deltas?.joy ?? 0, a = m.action;
    const book = a.match(/^read "([^"]+)"/); if (book) add("book", book[1], joy);
    const song = a.match(/now playing "([^"]+)"/); if (song) add("song", song[1], joy);
    if (m.place === "vending" && /^get /.test(a)) add("snack", a.replace(/^get (a pack of |a bag of |some |an |a )?/, "").split(" - ")[0], joy);
    if (!/^(walked|sleep|take a nap|read |get |was |reflected|sat down|hung|wrote a letter)/.test(a)) add("activity", a.split(" - ")[0].split(":")[0], joy);
    if (places[m.place]) add("place", places[m.place].label, joy);
  }
  const need: Record<string, number> = { book: 2, song: 2, snack: 2, activity: 3, place: 5 };
  const out: Favs = {};
  for (const [k, items] of Object.entries(tally)) {
    let best = "", score = -Infinity;
    for (const [name, joys] of Object.entries(items)) {
      if (joys.length < need[k]) continue;
      const sc = joys.reduce((x, y) => x + y, 0) / joys.length + Math.log(joys.length);
      if (sc > score) { score = sc; best = name; }
    }
    if (best) out[k] = best;
  }
  return out;
}
export const favLines = (f: Favs | undefined) => {
  const e = Object.entries(f ?? {});
  if (!e.length) return "";
  return "Your favourites (worked out from what has truly made you happiest - they can change as you change):\n" +
    e.map(([k, v]) => `- favourite ${FAV_KINDS[k] ?? k}: ${v}`).join("\n");
};
