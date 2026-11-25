import type { Config } from "@netlify/functions";
import {
  applyChoice, applyReflection, buildOptions, decisionPrompt, identityPrompt, instinct,
  parseJSON, readChoice, reflectionPrompt, REFLECT_EVERY, applyVisits, paceMinutes, type State,
  drawingPrompt, sanitizeSvg,
} from "../lib/pino.mts";
import { ask, hasBrain, NoBrain } from "../lib/brain.mts";
import { deleteKeys, deleteNote, listEvents, listNotes, loadState, saveState } from "../lib/store.mts";

// Pino's heartbeat. Netlify wakes this every minute (its shortest schedule).
// While Pino is new (his first few hours) he lives two moments per wake-up,
// ~22 seconds apart, so he thinks about twice a minute. After that he lives
// one moment every 5 minutes. Scheduled functions must finish within 30s.
const SECOND_MOMENT_AT = 22_000;
const HARD_STOP = 28_500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async () => {
  const start = Date.now();
  const s = await loadState();
  const fast = paceMinutes(s, start) < 1;
  if (!fast && s.last_tick_at && start - s.last_tick_at < 5 * 60_000 - 20_000) return;

  await moment(s, start);
  if (fast) {
    const wait = start + SECOND_MOMENT_AT - Date.now();
    if (wait > 0) await sleep(wait);
    if (Date.now() - start < SECOND_MOMENT_AT + 2_000) await moment(s, start);
  }
};

// One moment of Pino's life: notice visitors, then reflect or decide what to do.
async function moment(s: State, start: number) {
  const now = Date.now();
  const timeLeft = () => Math.max(3_000, Math.min(20_000, start + HARD_STOP - Date.now()));
  const minutes = s.last_tick_at ? Math.min(30, (now - s.last_tick_at) / 60_000) : 1;
  s.last_tick_at = now;

  // Fold in what visitors did since last time (pets, treats, chats)
  const visits = await listEvents();
  applyVisits(s, visits, now);
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
      const { text } = await ask(identityPrompt(s), reflectionPrompt(s), timeLeft());
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
    const opts = buildOptions(s, notes);
    let idx = -1, thought = "", note = "", brain = "instinct";

    try {
      const { text, model } = await ask(identityPrompt(s), decisionPrompt(s, opts, notes, now), timeLeft());
      ({ idx, thought, note } = readChoice(parseJSON(text), opts.length));
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
    await persist();
    if (answered) await deleteNote(answered.key);
    console.log(`Pino @ ${s.place}: ${action} - ${thought}`);
  } catch (e) {
    s.last_error = `Something went wrong: ${(e as Error).message}`;
    console.error(s.last_error);
    await persist();
  }
}

// Pino draws his picture himself: subject, style and colours are his choice.
async function finishDrawing(s: State, ms: number) {
  const i = s.pendingDrawing;
  if (i === null || !s.drawings[i]) { s.pendingDrawing = null; return; }
  const d = s.drawings[i];
  try {
    const { text } = await ask(identityPrompt(s), drawingPrompt(d), ms, 4000);
    const parsed = parseJSON(text);
    const svg = sanitizeSvg(parsed?.svg ?? text);
    if (svg) {
      d.svg = svg;
      if (typeof parsed?.title === "string" && parsed.title.trim()) d.title = parsed.title.trim().slice(0, 80);
      console.log(`Pino finished a drawing: ${d.title ?? d.text}`);
    } else console.log("Pino's drawing came out unreadable; he'll leave it as a sketch idea.");
    s.pendingDrawing = null;
  } catch (e) {
    console.log("Drawing interrupted:", (e as Error).message);
    // try again next moment, but don't get stuck on it forever
    if (!(e instanceof NoBrain) && (d as { tries?: number }).tries !== 1) (d as { tries?: number }).tries = 1;
    else s.pendingDrawing = null;
  }
}

// Wake every minute (cron runs in UTC; an interval doesn't care about time zones)
export const config: Config = {
  schedule: "* * * * *",
};
