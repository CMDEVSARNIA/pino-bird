import type { Config, Context } from "@netlify/functions";
import {
  applyChoice, applyReflection, buildOptions, decisionPrompt, identityPrompt, instinct,
  parseJSON, readChoice, reflectionPrompt, REFLECT_EVERY, applyVisits, paceMinutes, type State,
  drawingPrompt, sanitizeSvg, artSkill, mustSleep,
} from "../lib/pino.mts";
import { ask, hasBrain, NoBrain } from "../lib/brain.mts";
import { fetchWeather, needsRefresh, wet } from "../lib/weather.mts";
import { grow, newGarden } from "../lib/garden.mts";
import { acquireLock, deleteKeys, deleteNote, listEvents, listNotes, loadState, peopleIndex, releaseLock, saveState, updatePerson } from "../lib/store.mts";

// Pino's heartbeat. Netlify wakes this every minute (its shortest schedule).
// While Pino is new (his first few hours) he lives two moments per wake-up,
// ~22 seconds apart, so he thinks about twice a minute. After that he lives
// one moment every 5 minutes. Scheduled functions must finish within 30s.
const SECOND_MOMENT_AT = 13_000;
const HARD_STOP = 28_500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Netlify's scheduler stops waiting after ~15s and retries, so we answer it
// straight away and let Pino think in the background (waitUntil). A lock makes
// sure only one copy of his mind ever runs at once.
export default async (_req: Request, context: Context) => {
  const work = live();
  if (typeof context?.waitUntil === "function") {
    context.waitUntil(work);
    return new Response(null, { status: 204 });
  }
  await work;
  return new Response(null, { status: 204 });
};

async function live() {
  const start = Date.now();
  if (!(await acquireLock(40_000))) { console.log("Another heartbeat is already running; skipping."); return; }
  try {
    const s = await loadState();
    const pace = paceMinutes(s, start), fast = pace < 1;
    const since = s.last_tick_at ? start - s.last_tick_at : Infinity;
    if (fast ? since < 15_000 : since < pace * 60_000 - 20_000) return;

    await moment(s, start);
    if (fast) {
      const wait = start + SECOND_MOMENT_AT - Date.now();
      if (wait > 0) await sleep(wait);
      if (Date.now() - start < SECOND_MOMENT_AT + 2_000) await moment(s, start);
    }
  } finally {
    await releaseLock();
  }
}

// One moment of Pino's life: notice visitors, then reflect or decide what to do.
async function moment(s: State, start: number) {
  const now = Date.now();
  const timeLeft = () => Math.max(3_000, Math.min(20_000, start + HARD_STOP - Date.now()));
  const minutes = s.last_tick_at ? Math.min(30, (now - s.last_tick_at) / 60_000) : 1;
  s.last_tick_at = now;

  // Fold in what visitors did since last time (pets, treats, chats)
  const visits = await listEvents();
  applyVisits(s, visits, now);
  // the real weather in Sarnia, checked every 15 minutes
  if (needsRefresh(s.weather, now)) {
    const w = await fetchWeather(now);
    if (w) s.weather = w;
    else if (s.weather) s.weather.at = now - 10 * 60_000; // try again in about 5 minutes
  }
  // the garden grows (rain waters it for him)
  if (s.garden) grow(s.garden, now, wet(s.weather));
  else s.garden = newGarden(now);
  const persist = async () => {
    await saveState(s);
    if (visits.length) await deleteKeys(visits.map((v) => v.key));
  };

  // If he decided to draw but hasn't put it on paper yet, that's what this moment is for
  if (s.pendingDrawing !== null && hasBrain() && start + HARD_STOP - Date.now() > 14_000) {
    await finishDrawing(s, timeLeft());
    s.tick += 1;
    await persist();
    return;
  }

  const reflecting = hasBrain() && s.tick > 0 && s.tick % REFLECT_EVERY === 0 && s.memories.length >= 6
    && !s.memories.at(-1)?.action.startsWith("reflected");

  try {
    if (reflecting) {
      const { text } = await ask(identityPrompt(s), reflectionPrompt(s), timeLeft(), 1000);
      applyReflection(s, parseJSON(text), now);
      const last = s.memories.at(-1)!;
      s.memories.push({ ...last, place: s.place, action: "reflected on life", thought: s.insights.at(-1)?.text ?? last.thought,
        deltas: {}, note: "", first: false, bored: false });
      s.tick += 1;
      s.last_error = "";
      await persist();
      console.log("Pino reflected.");
      return;
    }

    const notes = await listNotes();
    const pals = await palsFor(now);
    const opts = buildOptions(s, notes, pals);
    let idx = -1, thought = "", note = "", brain = "instinct";

    if (mustSleep(s)) {
      // too exhausted to decide anything: he nods off right where he is
      const nap = s.place === "house" ? opts.find((o) => o.name.startsWith("sleep")) : opts.find((o) => o.name === "take a nap right here");
      if (nap) {
        applyChoice(s, nap, "Can't... keep... eyes... open... zzz", "", now, "instinct", undefined, minutes);
        await persist();
        console.log(`Pino fell asleep at the ${s.place}`);
        return;
      }
    }
    try {
      const friends = await friendsSummary(now);
      const { text, model } = await ask(identityPrompt(s), decisionPrompt(s, opts, notes, now, friends), timeLeft(), 1000);
      ({ idx, thought, note } = readChoice(parseJSON(text), opts.length));
      if (idx < 0) console.log("Brain reply unreadable:", text.slice(0, 300));
      brain = model;
      s.last_error = "";
    } catch (e) {
      s.last_error = e instanceof NoBrain ? e.message : `Brain hiccup: ${(e as Error).message}`;
      console.log(s.last_error);
    }
    if (idx < 0) {
      const inst = instinct(s, opts, now);
      idx = inst.idx;
      thought = thought || inst.thought;
    }

    const opt = opts[idx];
    const answered = opt.type === "reply" ? notes[0] : undefined;
    const action = applyChoice(s, opt, thought || "...", note, now, brain, answered, minutes);
    // a fresh drawing idea: draw it right away if there's time, otherwise next moment
    if (s.pendingDrawing !== null && hasBrain() && start + HARD_STOP - Date.now() > 14_000) await finishDrawing(s, timeLeft());
    await deliverLetters(s);
    await persist();
    if (answered) await deleteNote(answered.key);
    console.log(`Pino @ ${s.place}: ${action} - ${thought}`);
  } catch (e) {
    s.last_error = `Something went wrong: ${(e as Error).message}`;
    console.error(s.last_error);
    await persist();
  }
}

// Friends he could write to: people with names who've visited in the last week
async function palsFor(now: number) {
  try {
    const idx = await peopleIndex();
    return Object.entries(idx).filter(([, p]) => p.name && p.visits > 0 && now - p.lastSeen < 7 * 86_400_000)
      .sort((a, b) => b[1].lastSeen - a[1].lastSeen).slice(0, 4).map(([id, p]) => ({ id, name: p.name, note: p.note }));
  } catch { return []; }
}
// Pop his letters into his friends' mailboxes
async function deliverLetters(s: State) {
  for (const l of s.outbox ?? []) {
    const ok = await updatePerson(l.to, (p) => { p.letters = [...(p.letters ?? []), { at: l.at, t: l.t, text: l.text }].slice(-30); });
    console.log(ok ? `Pino's letter to ${l.name} was delivered.` : `Couldn't deliver Pino's letter to ${l.name}.`);
  }
  s.outbox = [];
}

// A few lines about the visitors he knows, most recent first
async function friendsSummary(now: number) {
  try {
    const idx = await peopleIndex();
    return Object.values(idx).filter((p) => p.visits > 0).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 6)
      .map((p) => {
        const mins = Math.round((now - p.lastSeen) / 60_000);
        const when = mins < 10 ? "here just now" : mins < 120 ? `${mins} min ago` : `${Math.round(mins / 60)} h ago`;
        return `- ${p.name || "a visitor whose name you don't know"} (visited ${p.visits}x, last ${when})${p.note ? `: ${p.note}` : ""}`;
      }).join("\n");
  } catch { return ""; }
}

// Pino draws his picture himself: subject, style and colours are his choice.
async function finishDrawing(s: State, ms: number) {
  const i = s.pendingDrawing;
  if (i === null || !s.drawings[i]) { s.pendingDrawing = null; return; }
  const d = s.drawings[i];
  try {
    s.art ??= { drawn: 0, lessons: [] };
    const { text } = await ask(identityPrompt(s), drawingPrompt(d, s.art), ms, 4000);
    const parsed = parseJSON(text);
    const svg = sanitizeSvg(parsed?.svg ?? text);
    if (svg) {
      d.svg = svg;
      d.skill = Math.round(artSkill(s.art.drawn, s.art.studied ?? 0) * 100) / 100; // how steady his hand was for this one
      d.seed = Math.floor(Math.random() * 1000);
      if (typeof parsed?.title === "string" && parsed.title.trim()) d.title = parsed.title.trim().slice(0, 80);
      if (typeof parsed?.lesson === "string" && parsed.lesson.trim()) {
        const lesson: string = parsed.lesson.trim().slice(0, 200);
        d.lesson = lesson;
        s.art.lessons = [...s.art.lessons, lesson].slice(-12);
      }
      s.art.drawn += 1;
      console.log(`Pino finished a drawing: ${d.title ?? d.text}`);
    } else console.log("Pino's drawing came out unreadable; he'll leave it as a sketch idea.");
    s.pendingDrawing = null;
  } catch (e) {
    console.log("Drawing interrupted:", (e as Error).message);
    // try again next moment, but don't get stuck on it forever
    if (!(e instanceof NoBrain) && d.tries !== 1) d.tries = 1;
    else s.pendingDrawing = null;
  }
}

// Wake every minute (cron runs in UTC; an interval doesn't care about time zones)
export const config: Config = {
  schedule: "* * * * *",
};
