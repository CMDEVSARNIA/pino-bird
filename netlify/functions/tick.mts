import type { Config } from "@netlify/functions";
import {
  applyChoice, applyReflection, buildOptions, decisionPrompt, identityPrompt, instinct,
  parseJSON, readChoice, reflectionPrompt, REFLECT_EVERY,
} from "../lib/pino.mts";
import { ask, hasBrain, NoBrain } from "../lib/brain.mts";
import { deleteNote, listNotes, loadState, saveState } from "../lib/store.mts";

// Pino's heartbeat: every 5 minutes he either decides what to do next,
// or (about once an hour) reflects on his life and rewrites his personality.
export default async () => {
  const now = Date.now();
  const s = await loadState();
  s.last_tick_at = now;

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
      await saveState(s);
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
    const action = applyChoice(s, opt, thought || "...", note, now, brain, answered);
    await saveState(s);
    if (answered) await deleteNote(answered.key);
    console.log(`Pino @ ${s.place}: ${action} - ${thought}`);
  } catch (e) {
    s.last_error = `Something went wrong: ${(e as Error).message}`;
    console.error(s.last_error);
    await saveState(s);
  }
};

// Every 5 minutes (cron runs in UTC; an interval doesn't care about time zones)
export const config: Config = {
  schedule: "*/5 * * * *",
};
