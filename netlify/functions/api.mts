import type { Config } from "@netlify/functions";
import { identityPrompt, isNight, parseJSON, publicView, talkPrompt, type Person } from "../lib/pino.mts";
import { ask, hasBrain } from "../lib/brain.mts";
import { GIFTS, GIFT_BY_ID } from "../lib/gifts.mts";
import {
  addChat, addEvent, addNote, claimGift, claimedGiftIds, countEvents, countNotes, getPerson, loadState, meet,
  peopleIndex, recentChats, type Who,
} from "../lib/store.mts";

// GET  /api/state   -> what the viewer page shows
// POST /api/talk    -> talk to him, instant reply      {"text", "who": {"id","name"}}
// POST /api/pet     -> pet him                         {"who"}
// POST /api/treat   -> drop him a snack                {"who"}
// POST /api/give    -> give him a one-of-a-kind gift   {"id", "who"}
// POST /api/message -> leave a note he answers later   {"text", "who"}

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

async function body(req: Request) {
  try { return (await req.json()) as Record<string, any>; } catch { return {}; }
}
function whoFrom(b: Record<string, any>): Who | null {
  const id = clean(b?.who?.id, 64);
  return /^[a-z0-9-]{8,64}$/i.test(id) ? { id, name: clean(b?.who?.name, 30) } : null;
}

export default async (req: Request) => {
  const { pathname } = new URL(req.url);
  const now = Date.now();

  if (req.method === "GET" && pathname === "/api/state") {
    const [s, unread, chats, claimed, people] = await Promise.all([loadState(), countNotes(), recentChats(14), claimedGiftIds(), peopleIndex()]);
    const gone = new Set([...claimed, ...(s.gifts?.received ?? [])]);
    return json({
      ...publicView(s, unread, now, chats.map(({ at, you, pino, name }) => ({ at, you, pino, name }))),
      giftsAvailable: GIFTS.filter((g) => !gone.has(g.id)).map(({ id, kind, name, emoji, desc }) => ({ id, kind, name, emoji, desc })),
      friends: Object.values(people).filter((p) => p.visits > 0).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 30)
        .map(({ name, visits, note, lastSeen }) => ({ name, visits, note, lastSeen })),
    });
  }

  if (req.method !== "POST") return new Response("Not found", { status: 404 });
  const b = await body(req);
  const who = whoFrom(b);

  if (pathname === "/api/message") {
    const text = clean(b.text, 300);
    if (!text) return json({ ok: false, error: "Write something first." }, 400);
    if ((await countNotes()) >= 20) return json({ ok: false, error: "Pino's mailbox is full. Try again later." }, 429);
    await addNote(who?.name ? `(from ${who.name}) ${text}` : text);
    await meet(who, () => {});
    return json({ ok: true });
  }

  if (pathname === "/api/pet" || pathname === "/api/treat") {
    if ((await countEvents()) >= 60) return json({ ok: false, reaction: "Pino needs a little breather. Try again in a few minutes." }, 429);
    const s = await loadState();
    const sleeping = s.doing.startsWith("sleep");
    let reaction: string;
    if (pathname === "/api/pet") {
      reaction = sleeping ? "Pino shuffles in his sleep and makes a tiny happy peep."
        : pick(["Pino fluffs up his feathers and leans into your hand.", "Pino closes his eyes and chirps softly.",
                "Pino does a happy little hop.", "Pino nuzzles your finger with his long beak."]);
    } else {
      if (s.needs.food >= 95) return json({ ok: false, reaction: "Pino looks at the snack, then at his round tummy. He's too full right now!" });
      reaction = sleeping ? "You leave a snack by his bed. He'll find it when he wakes up."
        : pick(["Pino gobbles it up and does a crumb-covered wiggle.", "Pino pecks at the treat. Crunch crunch!",
                "Pino inspects the snack very seriously, then eats it all."]);
    }
    await addEvent({ type: pathname === "/api/pet" ? "pet" : "treat", at: now, who: who ?? undefined });
    await meet(who, (p) => { if (pathname === "/api/pet") p.pets += 1; });
    return json({ ok: true, reaction });
  }

  if (pathname === "/api/give") {
    const gift = GIFT_BY_ID[clean(b.id, 80)];
    if (!gift) return json({ ok: false, error: "That gift doesn't exist." }, 400);
    const s = await loadState();
    if (s.gifts?.received?.includes(gift.id) || !(await claimGift(gift.id, who ?? { id: "anonymous", name: "" }))) {
      return json({ ok: false, error: "Someone already gave Pino that one!" }, 409);
    }
    await addEvent({ type: "gift", id: gift.id, at: now, who: who ?? undefined });
    await meet(who, (p) => { p.gave = [...p.gave, gift.name].slice(-20); });
    const reaction = gift.kind === "treat" ? `Pino's eyes go wide at ${gift.name}. He'll dig in any second!`
      : gift.kind === "book" ? `Pino hugs ${gift.name} and carries it off to his library shelf.`
      : gift.kind === "snack" ? `Pino watches a brand new button appear on the vending machine. ${gift.emoji}`
      : `Pino gasps. ${gift.name.charAt(0).toUpperCase() + gift.name.slice(1)}, just for him!`;
    return json({ ok: true, reaction });
  }

  if (pathname === "/api/talk") {
    const text = clean(b.text, 280);
    if (!text) return json({ ok: false, error: "Say something first." }, 400);
    const [s, chats, person] = await Promise.all([loadState(), recentChats(40), who ? getPerson(who.id) : Promise.resolve(null)]);
    if (chats.filter((c) => now - c.at < 60_000).length >= 8) {
      return json({ ok: false, error: "Pino's head is spinning. Give him a minute to think!" }, 429);
    }
    const known: Person | null = person ? { ...person, name: who?.name || person.name } : who?.name
      ? { id: who.id, name: who.name, firstMet: now, lastSeen: now, visits: 0, chats: 0, facts: [], gave: [], pets: 0 } : null;
    const mine = chats.filter((c) => who && c.who === who.id);

    let reply = "", mood = "curious", remember = "", theirName = "";
    if (!hasBrain()) {
      reply = "*tilts head and chirps* (Pino has no brain connected yet.)";
    } else {
      try {
        const { text: out } = await ask(identityPrompt(s), talkPrompt(s, mine, text, now, known), 20_000, 600);
        const parsed = parseJSON(out);
        reply = clean(parsed?.reply ?? out, 600);
        mood = typeof parsed?.mood === "string" ? parsed.mood : mood;
        remember = clean(parsed?.remember, 160);
        theirName = clean(parsed?.their_name, 30);
      } catch (e) {
        console.error("talk failed:", (e as Error).message);
        return json({ ok: false, error: "Pino got distracted by a butterfly. Try again in a moment." }, 503);
      }
    }
    if (!reply) reply = isNight(now) ? "*yawns* ...mm?" : "*chirp?*";
    const name = who?.name || theirName || person?.name || "";
    await Promise.all([
      addChat({ at: now, you: text, pino: reply, who: who?.id, name }),
      addEvent({ type: "talk", at: now, text, reply, who: who ? { id: who.id, name } : undefined }),
      meet(who ? { id: who.id, name } : null, (p) => {
        p.chats += 1;
        if (remember && !p.facts.some((f) => f.toLowerCase() === remember.toLowerCase())) p.facts = [...p.facts, remember].slice(-12);
      }),
    ]);
    return json({ ok: true, reply, mood, name: name || undefined, firstMeeting: !person });
  }

  return new Response("Not found", { status: 404 });
};

export const config: Config = {
  path: ["/api/state", "/api/message", "/api/pet", "/api/treat", "/api/give", "/api/talk"],
  method: ["GET", "POST"],
};
