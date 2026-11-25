import { getStore } from "@netlify/blobs";
import { newState, type Note, type State } from "./pino.mts";

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
  await store().setJSON("state", state);
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
export type VisitEvent = { type: "pet" | "treat" | "talk"; at: number; text?: string; reply?: string };
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
export type Chat = { at: number; you: string; pino: string };
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
