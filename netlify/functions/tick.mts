import type { Config } from "@netlify/functions";
import {
  applyChoice, applyReflection, buildOptions, decisionPrompt, identityPrompt, instinct,
  parseJSON, readChoice, reflectionPrompt, REFLECT_EVERY, applyVisits, paceMinutes,
} from "../lib/pino.mts";
import { ask, hasBrain, NoBrain } from "../lib/brain.mts";
import { deleteKeys, deleteNote, listEvents, listNotes, loadState, saveState } from "../lib/store.mts";

// Pino's heartbeat: every 5 minutes he either decides what to do next,
// or (about once an hour) reflects on his life and rewrites his personality.
export default async () => {
  const now = Date.now();
  const s = await loadState();

  // The scheduler wakes us every minute; Pino only acts at his own pace
  // (every minute for his first few hours, then every 5 minutes).
  const pace = paceMinutes(s, now);
  if (s.last_tick_at && now - s.last_tick_at < pace * 60_000 - 20_000) return;
  const minutes = s.last_tick_at ? Math.min(30, (now - s.last_tick_at) / 60_000) : pace;
  s.last_tick_at = now;

  // Fold in what visitors did since last time (pets, treats, chats)
  const visits = await listEvents();
  applyVisits(s, visits, now);
  const persist = async () => {
    await saveState(s);
    if (visits.length) await deleteKeys(visits.map((v) => v.key));
  };

  const reflecting = hasBrain() && s.tick > 0 && s.tick % REFLECT_EVERY === 0 && s.memories.length >= 6
    && !s.memories.at(-1)?.action.startsWith("reflected");

  try {
    if (reflecting) {
      const { text } = await ask(identityPrompt(s), reflectionPrompt(s));
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
      const { text, model } = await ask(identityPrompt(s), decisionPrompt(s, opts, notes, now));
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
    await persist();
    if (answered) await deleteNote(answered.key);
    console.log(`Pino @ ${s.place}: ${action} - ${thought}`);
  } catch (e) {
    s.last_error = `Something went wrong: ${(e as Error).message}`;
    console.error(s.last_error);
    await persist();
  }
};

// Wake every minute (cron runs in UTC; an interval doesn't care about time zones)
export const config: Config = {
  schedule: "* * * * *",
};
