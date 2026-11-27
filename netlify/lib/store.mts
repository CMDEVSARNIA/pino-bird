import { getStore } from "@netlify/blobs";
import { bondOf, topTopics } from "./life.mts";
import { toB64 } from "./b64.mts";
export type IndexEntry = { name: string; lastSeen: number; note: string; visits: number; viewing?: string; bond?: number; topics?: string[] };
import { newState, START_SEEDS, type Note, type Person, type State } from "./pino.mts";

// Site-wide store. Only the scheduled "tick" function writes "state".
// Everything visitors do (notes, pets, treats, chats) goes into its own key,
// so nothing ever overwrites Pino's state behind his back.
// Pinned to us-east-2, where his memories were first written, so a
// change in the functions region can never make him "forget" everything.
export const store = () => getStore({ name: "pino", consistency: "strong", region: "us-east-2" });

const newKey = (prefix: string) => `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function loadState(): Promise<State> {
  const s = store();
  const existing = (await s.get("state", { type: "json" })) as State | null;
  if (existing) return { ...newState(existing.born ?? Date.now()), ...existing };
  const fresh = newState(Date.now());
  await s.setJSON("state", fresh, { onlyIfNew: true });
  return ((await s.get("state", { type: "json" })) as State) ?? fresh;
}

export async function saveState(state: State) {
  // "due" is a tiny note beside his big state: the every-minute heartbeat reads just this to
  // decide whether it's time for him to think, instead of loading all his memories.
  await Promise.all([store().setJSON("state", state), store().setJSON("due", { last: state.last_tick_at ?? 0, born: state.born })]);
}

export async function loadDue(): Promise<{ last: number; born: number } | null> {
  try { return (await store().get("due", { type: "json" })) as { last: number; born: number } | null; } catch { return null; }
}

async function listKeys(prefix: string) {
  const { blobs } = await store().list({ prefix: `${prefix}/` });
  return blobs.map((b) => b.key).sort();
}

async function readMany<T>(keys: string[]) {
  const s = store();
  const out: (T & { key: string })[] = [];
  for (const key of keys) {
    const v = (await s.get(key, { type: "json" })) as T | null;
    if (v) out.push({ ...v, key });
  }
  return out;
}

// ---- notes (left for Pino to answer on his own time) ----
export async function listNotes(): Promise<Note[]> {
  return readMany<Note>((await listKeys("notes")).slice(0, 20));
}
export const countNotes = async () => (await listKeys("notes")).length;
export async function addNote(text: string) {
  await store().setJSON(newKey("notes"), { text, at: Date.now() });
}
export async function deleteNote(key: string) {
  await store().delete(key);
}

// ---- events (pets, treats, chats) that Pino folds into his memory each tick ----
export type Who = { id: string; name: string };
export type VisitEvent = { type: "pet" | "treat" | "talk" | "gift"; at: number; text?: string; reply?: string; id?: string; who?: Who; from?: string; promise?: string };
export async function addEvent(e: VisitEvent) {
  await store().setJSON(newKey("events"), e);
}
export async function listEvents() {
  return readMany<VisitEvent>((await listKeys("events")).slice(0, 60));
}
export const countEvents = async () => (await listKeys("events")).length;
export async function deleteKeys(keys: string[]) {
  const s = store();
  await Promise.all(keys.map((k) => s.delete(k)));
}

// ---- chat log (kept separately so the page can show it instantly) ----
export type Chat = { at: number; you: string; pino: string; who?: string; name?: string; react?: string };
export async function addChat(c: Chat) {
  await store().setJSON(newKey("chats"), c);
}
export async function recentChats(n = 12) {
  const keys = await listKeys("chats");
  // keep the log tidy: drop all but the newest 200
  if (keys.length > 200) await deleteKeys(keys.slice(0, keys.length - 200));
  return readMany<Chat>(keys.slice(-n));
}

// ---- heartbeat lock: only one copy of Pino's mind may run at a time
export async function acquireLock(staleMs: number): Promise<boolean> {
  const s = store();
  const now = Date.now();
  const r = await s.setJSON("lock", { at: now }, { onlyIfNew: true });
  if (r.modified) return true;
  const cur = (await s.get("lock", { type: "json" })) as { at: number } | null;
  if (!cur || now - cur.at > staleMs) {
    await s.setJSON("lock", { at: now });
    return true;
  }
  return false;
}
export async function releaseLock() {
  await store().delete("lock");
}

// ---- gifts: each one can only be given once (onlyIfNew makes the claim atomic)
export async function claimGift(id: string, who: Who) {
  const r = await store().setJSON(`gifts/${id}`, { at: Date.now(), who }, { onlyIfNew: true });
  return r.modified;
}
export async function claimedGiftIds() {
  return (await listKeys("gifts")).map((k) => k.slice("gifts/".length));
}

// ---- fast thinking: the owner can make Pino think once a minute for a while (read by every heartbeat)
export async function getBoost() {
  const b = await store().get("boost", { type: "json" }) as { until?: number } | null;
  return b ? Number(b.until ?? 0) : Date.parse("2026-11-26T02:00:00Z"); // until the switch is first used: tonight's boost, to 9 pm
}
export async function setBoost(until: number) { await store().setJSON("boost", { until }); }

// ---- people Pino has met (keyed by a random id the visitor's browser keeps)
const safeId = (id: string) => /^[a-z0-9-]{8,64}$/i.test(id) ? id : null;
export async function getPerson(id: string): Promise<Person | null> {
  const k = safeId(id); if (!k) return null;
  return (await store().get(`people/${k}`, { type: "json" })) as Person | null;
}
export async function savePerson(p: Person) {
  const k = safeId(p.id); if (!k) return;
  await store().setJSON(`people/${k}`, p);
  await indexPerson(p);
}
async function indexPerson(p: Person) {
  const k = safeId(p.id); if (!k) return;
  // small index so the heartbeat can think about friends without reading every record
  // conditional write + retry, so two visitors pinging at once don't knock each other out of the index
  for (let attempt = 0; attempt < 6; attempt++) {
    const cur = await store().getWithMetadata("people-index", { type: "json" });
    const idx = ((cur?.data as Record<string, IndexEntry> | undefined) ?? {});
    idx[k] = { name: p.name, lastSeen: p.lastSeen, note: p.facts.at(-1) ?? (p.gave.length ? `gave me ${p.gave.at(-1)}` : ""), visits: p.visits, viewing: p.viewing,
      bond: bondOf(p), topics: topTopics(p.topics) };
    const r = attempt === 5 ? await store().setJSON("people-index", idx)
      : cur?.etag ? await store().setJSON("people-index", idx, { onlyIfMatch: cur.etag }) : await store().setJSON("people-index", idx, { onlyIfNew: true });
    if (attempt === 5 || r.modified) return;
    await new Promise((res) => setTimeout(res, 50 + Math.random() * 100));
  }
}
export async function peopleIndex() {
  return ((await store().get("people-index", { type: "json" })) as Record<string, IndexEntry> | null) ?? {};
}
// Touch (or create) a person whenever they do something
// Change someone's record without counting it as a visit (e.g. Pino's letters arriving in their mailbox)
export async function updatePerson(id: string, change: (p: Person) => void) {
  const k = safeId(id); if (!k) return null;
  const key = `people/${k}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const cur = await store().getWithMetadata(key, { type: "json" });
    if (!cur?.data) return null;
    const p = cur.data as Person; change(p);
    const r = await store().setJSON(key, p, { onlyIfMatch: cur.etag });
    if (r.modified) return p;
    await new Promise((res) => setTimeout(res, 60 + Math.random() * 120));
  }
  return null;
}

// Changes are applied with a conditional write (only if nobody else saved this person in between),
// retrying on a clash, so two things happening at once - say a treat and the once-a-minute
// "still watching" ping - can't overwrite each other's seeds.
export async function meet(who: Who | null, change: (p: Person) => void) {
  const k = who ? safeId(who.id) : null;
  if (!who || !k) return null;
  const key = `people/${k}`;
  for (let attempt = 0; ; attempt++) {
    const now = Date.now();
    const cur = await store().getWithMetadata(key, { type: "json" });
    const p: Person = (cur?.data as Person | undefined) ?? { id: who.id, name: "", firstMet: now, lastSeen: 0, visits: 0, chats: 0, facts: [], gave: [], pets: 0, seeds: START_SEEDS };
    if (who.name && who.name !== p.name) p.name = who.name;
    if (now - p.lastSeen > 30 * 60_000) p.visits += 1; // a new visit after 30 quiet minutes
    p.lastSeen = now;
    change(p);
    const last = attempt >= 5;
    const r = last ? await store().setJSON(key, p)
      : cur?.etag ? await store().setJSON(key, p, { onlyIfMatch: cur.etag }) : await store().setJSON(key, p, { onlyIfNew: true });
    if (last || r.modified) { await indexPerson(p); return p; }
    await new Promise((res) => setTimeout(res, 60 + Math.random() * 120));
  }
}

// Once: work out friendship levels for everyone he already knew (the index didn't have them before)
export async function rebuildBonds() {
  const { blobs } = await store().list({ prefix: "people/" });
  for (const b of blobs) {
    const p = (await store().get(b.key, { type: "json" })) as Person | null;
    if (p?.id && p.visits > 0) await indexPerson(p);
  }
}

// ---- Pino's eyes: the latest view of his world, drawn by a friend's phone
export type EyesMeta = { at: number; by: string; place: string; room: string; doing: string };
export async function saveEyes(jpeg: Uint8Array, meta: EyesMeta) {
  await store().set("eyes", jpeg.buffer.slice(jpeg.byteOffset, jpeg.byteOffset + jpeg.byteLength) as ArrayBuffer, { metadata: meta });
}
export async function loadEyes(): Promise<{ data: string; meta: EyesMeta } | null> {
  try {
    const r = await store().getWithMetadata("eyes", { type: "arrayBuffer" });
    if (!r?.data) return null;
    return { data: toB64(new Uint8Array(r.data as ArrayBuffer)), meta: r.metadata as EyesMeta };
  } catch { return null; }
}
export async function eyesAge(): Promise<number> {
  try { const m = await store().getMetadata("eyes"); return m ? Date.now() - ((m.metadata as EyesMeta)?.at ?? 0) : Infinity; } catch { return Infinity; }
}
