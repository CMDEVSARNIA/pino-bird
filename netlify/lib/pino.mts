// The bird's world and mind. Pure logic - no storage here, so it's easy to test.

export const NAME = "Pino";
export const SPECIES = "kiwi bird";
export const TZ = "America/Toronto"; // day and night follow real Toronto time
export const REFLECT_EVERY = 12;     // reflects every 12 decisions
export const FAST_HOURS = 3;         // for his first 3 hours he thinks every minute, then every 5

export function paceMinutes(s: { born: number }, now: number) {
  return now - s.born < FAST_HOURS * 3_600_000 ? 1 : 5;
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
      "tidy up the house": { joy: 4, energy: -3 },
      "look out the window": { joy: 4, energy: 2 },
    },
  },
  library: {
    label: "library",
    desc: "the town library, quiet and warm, full of old books and a big wooden drawing table",
    activities: {
      "read a book": { joy: 8, energy: -2 },
      "write in my journal": { joy: 6, energy: -2, kind: "journal" },
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
  park: {
    label: "park",
    desc: "a small park with a big tree, a bench and a pond where ducks paddle about",
    activities: {
      "play in the leaf pile": { joy: 12, energy: -7 },
      "watch the ducks": { joy: 6, energy: 3 },
      "sit on the bench": { joy: 3, energy: 5 },
    },
  },
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export type Memory = {
  t: string; place: string; action: string; thought: string; note: string;
  deltas: Partial<Record<Need, number>>; first: boolean; bored: boolean; brain: string;
};
export type Note = { key: string; text: string; at: number };
export type State = {
  born: number; tick: number; place: string;
  needs: Record<Need, number>;
  personality: string;
  insights: { t: string; text: string }[];
  memories: Memory[];
  journal: { t: string; text: string }[];
  drawings: { t: string; text: string }[];
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
  if (m) { try { return JSON.parse(m[0]); } catch { /* ignore */ } }
  return null;
}

// ---------------------------------------------------------------------------
// Options and prompts
// ---------------------------------------------------------------------------
export type Option = { type: "do" | "go" | "reply" | "rest"; name: string; label: string };

export function buildOptions(s: State, notes: Note[]): Option[] {
  const here = s.place;
  const opts: Option[] = Object.keys(PLACES[here].activities).map((a) => ({
    type: "do", name: a, label: `${a} (here at the ${PLACES[here].label})`,
  }));
  for (const [k, p] of Object.entries(PLACES)) {
    if (k !== here) opts.push({ type: "go", name: k, label: `walk to the ${p.label}` });
  }
  if (notes.length) {
    opts.push({ type: "reply", name: "reply to a visitor's note", label: 'reply to the visitor\'s note (write your reply in "note")' });
  }
  opts.push({ type: "rest", name: "sit and think", label: "just sit and think for a while" });
  return opts;
}

export function identityPrompt(s: State) {
  const insights = s.insights.slice(-6).map((i) => `- ${i.text}`).join("\n") || "- (nothing yet)";
  return [
    `You are ${NAME}, a small ${SPECIES} who lives alone in a tiny town with a little house, a library, a vending machine and a park.`,
    "Nobody gives you instructions or tasks. You are not an assistant and you don't help anyone.",
    "You simply live: you notice how you feel, choose what to do next, and slowly learn what you enjoy.",
    "You are curious, and doing the same thing over and over gets boring.",
    "Sometimes visitors come by: they may pet you, give you treats or chat with you.",
    "",
    `Your personality, in your own words (you rewrite this yourself as you grow):\n${s.personality}`,
    "",
    `Things you have realised about yourself:\n${insights}`,
    "",
    "Always reply with ONLY a JSON object and no other text.",
  ].join("\n");
}

export function decisionPrompt(s: State, opts: Option[], notes: Note[], now: number) {
  const feel = NEEDS.map((n) => `- ${n}: ${s.needs[n]}/100 (${describe(n, s.needs[n])})`).join("\n");
  const history = s.memories.slice(-8).map(memoryLine).join("\n") || "- (you just woke up for the very first time)";
  const recent = s.memories.slice(-5).map((m) => m.action).filter((a) => !a.startsWith("sleep"));
  let bored = "";
  if (recent.length) {
    const top = recent.reduce((a, b) => (recent.filter((x) => x === a).length >= recent.filter((x) => x === b).length ? a : b));
    if (recent.filter((x) => x === top).length >= 3) bored = `\nYou've done "${top}" a lot lately and it's starting to feel boring.\n`;
  }
  const note = notes.length ? `\nSomeone visited and left you a note: "${notes[0].text}"\n` : "";
  const { weekday } = localTime(now);
  const night = isNight(now) ? "night time - it's dark and most creatures are asleep" : "daytime";
  const numbered = opts.map((o, i) => `${i + 1}. ${o.label}`).join("\n");
  return (
    `It is ${weekday}, ${clockStr(s, now)} (${night}). You are at the ${PLACES[s.place].label}: ${PLACES[s.place].desc}.\n\n` +
    `How you feel right now:\n${feel}\n${bored}${note}\n` +
    `What happened recently (oldest first):\n${history}\n\n` +
    `What you could do next:\n${numbered}\n\n` +
    "Pick ONE option. Reply with JSON exactly like this:\n" +
    '{"thought": "one or two sentences, first person, about how you feel and why you chose this", ' +
    '"choice": <option number>, ' +
    '"note": "only when writing in your journal, drawing (describe the picture you draw), or replying to a visitor - otherwise an empty string"}'
  );
}

export function reflectionPrompt(s: State) {
  const recent = s.memories.slice(-30).map(memoryLine).join("\n");
  return (
    `Look back over what you've done lately:\n${recent}\n\n` +
    `Your current self-description:\n${s.personality}\n\n` +
    "Think about what made you feel good or bad, what bored you, and what you're curious to try next. " +
    "Reply with JSON exactly like this:\n" +
    '{"insights": ["a short realisation about yourself", "another one"], ' +
    '"personality": "your updated self-description: 3-5 sentences, first person, including things you like and dislike"}'
  );
}

// Simple instincts, used when no AI brain is connected or the AI fails.
export function instinct(s: State, opts: Option[], now: number): { idx: number; thought: string } {
  const pick = (pred: (o: Option) => boolean) => opts.findIndex(pred);
  let idx = -1, thought = "";
  if (s.needs.energy < 30 || (isNight(now) && s.needs.energy < 85)) {
    idx = s.place === "house" ? pick((o) => o.name.startsWith("sleep")) : pick((o) => o.type === "go" && o.name === "house");
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

  if (opt.type === "go") {
    s.place = opt.name;
    deltas = { energy: -2 };
    action = `walked to the ${PLACES[opt.name].label}`;
    note = "";
  } else {
    action = opt.name;
    let eff: Effects;
    if (opt.type === "do") eff = { ...PLACES[here].activities[action] };
    else if (opt.type === "reply") eff = { joy: 10, energy: -2 };
    else eff = { energy: 3, joy: 1 };
    const kind = eff.kind;
    delete eff.kind;

    const isSleep = action.startsWith("sleep");
    const repeats = s.memories.slice(-6).filter((m) => m.action === action).length;
    if (!isSleep) {
      if ((eff.joy ?? 0) > 0) eff.joy = Math.round(eff.joy! * Math.max(0, 1 - 0.4 * repeats));
      if (repeats >= 2) { eff.joy = (eff.joy ?? 0) - 6; bored = true; }
    }
    if (!s.tried[action]) { eff.joy = (eff.joy ?? 0) + 8; first = true; }
    if (isSleep && isNight(now)) eff.energy = (eff.energy ?? 0) + 6;
    s.tried[action] = (s.tried[action] ?? 0) + 1;
    deltas = eff as Partial<Record<Need, number>>;

    if (kind === "journal" && note) s.journal.push({ t, text: note });
    if (kind === "drawing" && note) s.drawings.push({ t, text: note });
    if (opt.type === "reply" && answeredNote) {
      s.conversations.push({ t, visitor: answeredNote.text, reply: note || "(looked at the note for a long time, then nodded)" });
    }
  }

  for (const [k, v] of Object.entries(deltas)) s.needs[k as Need] = clamp(s.needs[k as Need] + (v ?? 0));

  // the passage of time: needs drain by real minutes passed, not by decisions made
  const night = isNight(now);
  const scale = Math.min(2, Math.max(0.2, minutes / 5));
  const decay: Record<Need, number> = { food: -1, energy: night ? -1.5 : -1, joy: -1 };
  if (action.startsWith("sleep")) decay.energy = 0;
  for (const n of NEEDS) s.needs[n] = clamp(s.needs[n] + decay[n] * scale);

  s.memories.push({ t, place: here, action, thought, note, deltas, first, bored, brain });
  s.memories = s.memories.slice(-400);
  s.journal = s.journal.slice(-150);
  s.drawings = s.drawings.slice(-150);
  s.conversations = s.conversations.slice(-150);
  s.thought = thought;
  s.doing = action;
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
}

// ---------------------------------------------------------------------------
// Visitors: pets, treats and conversations
// ---------------------------------------------------------------------------
type Visit = { type: "pet" | "treat" | "talk"; at: number; text?: string; reply?: string };

// Folds what visitors did since the last tick into Pino's needs and memories.
export function applyVisits(s: State, visits: Visit[], now: number) {
  if (!visits.length) return;
  const t = clockStr(s, now);
  const base = { t, place: s.place, note: "", first: false, bored: false, brain: "visitor" };
  const remember = (action: string, thought: string, deltas: Partial<Record<Need, number>>) => {
    for (const [k, v] of Object.entries(deltas)) s.needs[k as Need] = clamp(s.needs[k as Need] + (v ?? 0));
    s.memories.push({ ...base, action, thought, deltas });
  };

  const pets = visits.filter((v) => v.type === "pet").length;
  if (pets) {
    remember(pets === 1 ? "was petted by a visitor" : `was petted ${pets} times by visitors`,
      pets > 4 ? "So many pats! My feathers are all fluffed up." : "Someone gave me a gentle pat. That was nice.",
      { joy: Math.min(15, 4 * pets) });
  }
  const treats = visits.filter((v) => v.type === "treat").length;
  if (treats) {
    remember(treats === 1 ? "was given a treat by a visitor" : `was given ${treats} treats by visitors`,
      "A visitor dropped me a snack. Crunchy!",
      { food: Math.min(40, 12 * treats), joy: Math.min(9, 3 * treats) });
  }
  for (const v of visits.filter((x) => x.type === "talk").slice(-5)) {
    remember("talked with a visitor", `They said "${(v.text ?? "").slice(0, 160)}" and I said "${(v.reply ?? "").slice(0, 160)}"`, { joy: 5 });
  }
  s.memories = s.memories.slice(-400);
}

export function talkPrompt(s: State, chats: { you: string; pino: string }[], text: string, now: number) {
  const feel = NEEDS.map((n) => `${n} ${describe(n, s.needs[n])}`).join(", ");
  const recentLife = s.memories.slice(-6).map(memoryLine).join("\n") || "- (nothing yet)";
  const convo = chats.slice(-6).map((c) => `Visitor: ${c.you}\n${NAME}: ${c.pino}`).join("\n") || "(this is the start of the conversation)";
  return (
    `It is ${clockStr(s, now)} (${isNight(now) ? "night" : "day"}). You are at the ${PLACES[s.place].label}, ` +
    `currently "${s.doing}". You feel: ${feel}.\n\n` +
    `What you've been up to:\n${recentLife}\n\n` +
    `A visitor has come to your town and is talking to you. Conversation so far:\n${convo}\n\n` +
    `The visitor says: "${text}"\n\n` +
    `Answer as ${NAME} the ${SPECIES}: in character, warm and a bit quirky, 1-3 short sentences, ` +
    "no emojis, never claim to be an assistant. You can mention what you're doing or how you feel. " +
    "If you're very sleepy you can be drowsy. If asked to do something you can't do in your town, say so in a bird-like way.\n" +
    'Reply with JSON exactly like this: {"reply": "what you say", "mood": "one of happy, curious, shy, sleepy, grumpy, excited"}'
  );
}

// Trimmed copy for the viewer page
export function publicView(s: State, unread: number, now: number, chats: { at: number; you: string; pino: string }[] = []) {
  return {
    chats,
    name: NAME, species: SPECIES,
    clock: clockStr(s, now), night: isNight(now), weekday: localTime(now).weekday,
    place: s.place, needs: s.needs, thought: s.thought, doing: s.doing,
    personality: s.personality, insights: s.insights.slice(-20),
    memories: s.memories.slice(-40), journal: s.journal.slice(-30),
    drawings: s.drawings.slice(-30), conversations: s.conversations.slice(-30),
    unread, tick: s.tick, last_error: s.last_error, last_tick_at: s.last_tick_at, pace: paceMinutes(s, now),
    places: Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, p.label])),
  };
}
