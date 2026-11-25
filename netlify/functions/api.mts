import type { Config, Context } from "@netlify/functions";
import { earn, EARN, identityPrompt, isNight, parseJSON, publicView, seedsOf, START_SEEDS, talkPrompt, type Person } from "../lib/pino.mts";
import { ask, hasBrain } from "../lib/brain.mts";
import { GIFTS, GIFT_BY_ID, QUICK_TREAT_PRICE } from "../lib/gifts.mts";
import {
  addChat, addEvent, addNote, claimGift, claimedGiftIds, countEvents, countNotes, getPerson, loadState, meet,
  peopleIndex, recentChats, store, type Who,
} from "../lib/store.mts";
import { EXHIBIT_BY_ID } from "../lib/museum.mts";

// GET  /api/state   -> what the viewer page shows
// POST /api/talk    -> talk to him, instant reply      {"text", "who": {"id","name"}}
// POST /api/pet     -> pet him                         {"who"}
// POST /api/treat   -> drop him a snack                {"who"}
// POST /api/give    -> give him a one-of-a-kind gift   {"id", "who"}
// POST /api/message -> leave a note he answers later   {"text", "who"}
// POST /api/watch   -> "I'm still watching" ping, earns seeds (1/min, capped daily)
// GET  /api/museum-image?id=starry -> picture of a museum painting (public domain, via Wikipedia; cached)
// Seeds 🌱 are earned by watching, chatting and petting, and spent on gifts and treats.

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

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const { pathname } = url;
  const now = Date.now();

  if (req.method === "GET" && pathname === "/api/museum-image") return museumImage(url.searchParams.get("id") ?? "");

  if (req.method === "GET" && pathname === "/api/state") {
    const meId = url.searchParams.get("who") ?? "";
    const [s, unread, chats, claimed, people, mePerson] = await Promise.all([loadState(), countNotes(), recentChats(14), claimedGiftIds(), peopleIndex(),
      /^[a-z0-9-]{8,64}$/i.test(meId) ? getPerson(meId) : Promise.resolve(null)]);
    const gone = new Set([...claimed, ...(s.gifts?.received ?? [])]);
    return json({
      ...publicView(s, unread, now, chats.map(({ at, you, pino, name, react }) => ({ at, you, pino, name, react }))),
      version: context?.deploy?.id ?? "",
      giftsAvailable: GIFTS.filter((g) => !gone.has(g.id)).map(({ id, kind, name, emoji, desc, price }) => ({ id, kind, name, emoji, desc, price })),
      me: { name: mePerson?.name ?? null, seeds: seedsOf(mePerson), earned: mePerson?.earned ?? null, rules: EARN, treatPrice: QUICK_TREAT_PRICE },
      friends: Object.values(people).filter((p) => p.visits > 0).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 30)
        .map(({ name, visits, note, lastSeen }) => ({ name, visits, note, lastSeen })),
    });
  }

  if (req.method !== "POST") return new Response("Not found", { status: 404 });
  const b = await body(req);
  const who = whoFrom(b);

  if (pathname === "/api/watch") {
    if (!who) return json({ ok: false }, 400);
    let got = 0;
    const p = await meet(who, (p) => {
      if (now - (p.lastWatch ?? 0) >= 50_000) { got = earn(p, "watch", now); p.lastWatch = now; }
    });
    return json({ ok: true, got, seeds: seedsOf(p) });
  }

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
    if (pathname === "/api/treat") {
      const before = who ? await getPerson(who.id) : null;
      if (!who || seedsOf(before) < QUICK_TREAT_PRICE) {
        return json({ ok: false, reaction: `A treat costs 🌱 ${QUICK_TREAT_PRICE}. Earn seeds by watching and chatting with Pino!` }, 402);
      }
    }
    let got = 0;
    const p = await meet(who, (p) => {
      if (pathname === "/api/pet") { p.pets += 1; got = earn(p, "pet", now); }
      else { p.seeds = seedsOf(p) - QUICK_TREAT_PRICE; }
    });
    await addEvent({ type: pathname === "/api/pet" ? "pet" : "treat", at: now, who: who ?? undefined });
    return json({ ok: true, reaction, got, seeds: seedsOf(p) });
  }

  if (pathname === "/api/give") {
    const gift = GIFT_BY_ID[clean(b.id, 80)];
    if (!gift) return json({ ok: false, error: "That gift doesn't exist." }, 400);
    if (!who) return json({ ok: false, error: "Refresh the page and try again." }, 400);
    const giver = await getPerson(who.id);
    if (seedsOf(giver) < gift.price) {
      return json({ ok: false, error: `That costs 🌱 ${gift.price} and you have 🌱 ${seedsOf(giver)}. Keep watching and chatting with Pino to earn more!` }, 402);
    }
    const s = await loadState();
    if (s.gifts?.received?.includes(gift.id) || !(await claimGift(gift.id, who))) {
      return json({ ok: false, error: "Someone already gave Pino that one!" }, 409);
    }
    await addEvent({ type: "gift", id: gift.id, at: now, who });
    const after = await meet(who, (p) => { p.gave = [...p.gave, gift.name].slice(-20); p.seeds = seedsOf(p) - gift.price; });
    const reaction = gift.kind === "treat" ? `Pino's eyes go wide at ${gift.name}. He'll dig in any second!`
      : gift.kind === "book" ? `Pino hugs ${gift.name} and carries it off to his library shelf.`
      : gift.kind === "holiday" ? `Pino tucks ${gift.name} under his wing and hurries to the library. ${gift.emoji}`
      : gift.kind === "artbook" ? `Pino flips through ${gift.name} with wide eyes. He's going to practise everything in it!`
      : gift.kind === "snack" ? `Pino watches a brand new button appear on the vending machine. ${gift.emoji}`
      : gift.kind === "song" ? `Pino puts ${gift.name} on his gramophone straight away! 💿`
      : `Pino gasps. ${gift.name.charAt(0).toUpperCase() + gift.name.slice(1)}, just for him!`;
    return json({ ok: true, reaction, seeds: seedsOf(after) });
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

    let reply = "", mood = "curious", remember = "", theirName = "", react = "";
    if (!hasBrain()) {
      reply = "*tilts head and chirps* (Pino has no brain connected yet.)";
    } else {
      try {
        const { text: out } = await ask(identityPrompt(s), talkPrompt(s, mine, text, now, known), 20_000, 900);
        const parsed = parseJSON(out);
        reply = clean(parsed?.reply ?? out, 600);
        mood = typeof parsed?.mood === "string" ? parsed.mood : mood;
        remember = clean(parsed?.remember, 160);
        theirName = clean(parsed?.their_name, 30);
        // one emoji only (a short grapheme run, no words)
        const r = clean(parsed?.react, 16);
        react = /^[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\ufe0f]{1,12}$/u.test(r) ? r : "";
      } catch (e) {
        console.error("talk failed:", (e as Error).message);
        return json({ ok: false, error: "Pino got distracted by a butterfly. Try again in a moment." }, 503);
      }
    }
    if (!reply) reply = isNight(now) ? "*yawns* ...mm?" : "*chirp?*";
    const name = who?.name || theirName || person?.name || "";
    let got = 0, seeds = seedsOf(person);
    await Promise.all([
      addChat({ at: now, you: text, pino: reply, who: who?.id, name, react }),
      addEvent({ type: "talk", at: now, text, reply, who: who ? { id: who.id, name } : undefined }),
      meet(who ? { id: who.id, name } : null, (p) => {
        p.chats += 1;
        got = earn(p, "chat", now); seeds = seedsOf(p);
        if (remember && !p.facts.some((f) => f.toLowerCase() === remember.toLowerCase())) p.facts = [...p.facts, remember].slice(-12);
      }),
    ]);
    return json({ ok: true, reply, mood, react, at: now, name: name || undefined, firstMeeting: !person, got, seeds });
  }

  return new Response("Not found", { status: 404 });
};

export const config: Config = {
  path: ["/api/state", "/api/message", "/api/pet", "/api/treat", "/api/give", "/api/talk", "/api/watch", "/api/museum-image"],
  method: ["GET", "POST"],
};

// Museum paintings are all public domain. We fetch each one once from Wikipedia's
// page summary (its lead image), keep a copy in Blobs, and serve it from here so
// the 3D view can use it as a texture.
const UA = "PinoTown/1.0 (https://pino-bird.netlify.app; an AI kiwi's museum)";
async function museumImage(id: string) {
  const ex = EXHIBIT_BY_ID[id];
  if (!ex?.wiki) return new Response("No such painting", { status: 404 });
  const key = `museum-img/${id}`;
  const headers = (type: string) => ({ "Content-Type": type, "Cache-Control": "public, max-age=604800, immutable" });
  const cached = await store().getWithMetadata(key, { type: "arrayBuffer" });
  if (cached?.data) return new Response(cached.data, { headers: headers(String(cached.metadata?.type ?? "image/jpeg")) });
  try {
    const sum = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ex.wiki)}`, {
      headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(6000),
    }).then((r) => r.json());
    const thumb: string | undefined = sum?.thumbnail?.source;
    if (!thumb) throw new Error("no picture on the page");
    let img: Response | null = null;
    for (const src of [thumb.replace(/\/\d+px-/, "/500px-"), thumb]) {
      const r = await fetch(src, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
      if (r.ok && (r.headers.get("content-type") ?? "").startsWith("image/")) { img = r; break; }
    }
    if (!img) throw new Error("picture download failed");
    const type = img.headers.get("content-type") ?? "image/jpeg";
    const data = await img.arrayBuffer();
    await store().set(key, data, { metadata: { type, src: thumb } });
    return new Response(data, { headers: headers(type) });
  } catch (e) {
    console.log(`Museum picture ${id} failed:`, (e as Error).message);
    return new Response("Picture unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
