import type { Config } from "@netlify/functions";
import { identityPrompt, isNight, parseJSON, publicView, talkPrompt } from "../lib/pino.mts";
import { ask, hasBrain } from "../lib/brain.mts";
import { addChat, addEvent, addNote, countEvents, countNotes, loadState, recentChats } from "../lib/store.mts";

// GET  /api/state   -> what the viewer page shows
// POST /api/message -> leave Pino a note he answers on his own time  {"text": "..."}
// POST /api/pet     -> pet him
// POST /api/treat   -> give him a snack
// POST /api/talk    -> talk to him, instant reply  {"text": "..."}

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function readText(req: Request, max: number) {
  try {
    const body = await req.json();
    return String(body?.text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  } catch {
    return "";
  }
}

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export default async (req: Request) => {
  const { pathname } = new URL(req.url);
  const now = Date.now();

  if (req.method === "GET" && pathname === "/api/state") {
    const [s, unread, chats] = await Promise.all([loadState(), countNotes(), recentChats(12)]);
    return json(publicView(s, unread, now, chats.map(({ at, you, pino }) => ({ at, you, pino }))));
  }

  if (req.method !== "POST") return new Response("Not found", { status: 404 });

  if (pathname === "/api/message") {
    const text = await readText(req, 300);
    if (!text) return json({ ok: false, error: "Write something first." }, 400);
    if ((await countNotes()) >= 20) return json({ ok: false, error: "Pino's mailbox is full. Try again later." }, 429);
    await addNote(text);
    return json({ ok: true });
  }

  if (pathname === "/api/pet" || pathname === "/api/treat") {
    if ((await countEvents()) >= 60) {
      return json({ ok: false, reaction: "Pino needs a little breather. Try again in a few minutes." }, 429);
    }
    const s = await loadState();
    const sleeping = s.doing.startsWith("sleep");
    let reaction: string;
    if (pathname === "/api/pet") {
      reaction = sleeping
        ? "Pino shuffles in his sleep and makes a tiny happy peep."
        : pick(["Pino fluffs up his feathers and leans into your hand.", "Pino closes his eyes and chirps softly.",
                "Pino does a happy little hop.", "Pino nuzzles your finger with his long beak."]);
    } else {
      if (s.needs.food >= 95) {
        return json({ ok: false, reaction: "Pino looks at the snack, then at his round tummy. He's too full right now!" });
      }
      reaction = sleeping
        ? "You leave a snack by his bed. He'll find it when he wakes up."
        : pick(["Pino gobbles it up and does a crumb-covered wiggle.", "Pino pecks at the treat. Crunch crunch!",
                "Pino inspects the snack very seriously, then eats it all."]);
    }
    await addEvent({ type: pathname === "/api/pet" ? "pet" : "treat", at: now });
    return json({ ok: true, reaction });
  }

  if (pathname === "/api/talk") {
    const text = await readText(req, 280);
    if (!text) return json({ ok: false, error: "Say something first." }, 400);
    const [s, chats] = await Promise.all([loadState(), recentChats(8)]);
    if (chats.filter((c) => now - c.at < 60_000).length >= 6) {
      return json({ ok: false, error: "Pino's head is spinning. Give him a minute to think!" }, 429);
    }

    let reply = "", mood = "curious";
    if (!hasBrain()) {
      reply = "*tilts head and chirps* (Pino has no brain connected yet.)";
    } else {
      try {
        const { text: out } = await ask(identityPrompt(s), talkPrompt(s, chats, text, now));
        const parsed = parseJSON(out);
        reply = String(parsed?.reply ?? out ?? "").trim().slice(0, 500);
        mood = typeof parsed?.mood === "string" ? parsed.mood : mood;
      } catch (e) {
        console.error("talk failed:", (e as Error).message);
        return json({ ok: false, error: "Pino got distracted by a butterfly. Try again in a moment." }, 503);
      }
    }
    if (!reply) reply = isNight(now) ? "*yawns* ...mm?" : "*chirp?*";
    await Promise.all([addChat({ at: now, you: text, pino: reply }), addEvent({ type: "talk", at: now, text, reply })]);
    return json({ ok: true, reply, mood });
  }

  return new Response("Not found", { status: 404 });
};

export const config: Config = {
  path: ["/api/state", "/api/message", "/api/pet", "/api/treat", "/api/talk"],
  method: ["GET", "POST"],
};
