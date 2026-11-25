import { getStore } from "@netlify/blobs";
import { newState, type Note, type State } from "./pino.mts";

// Site-wide store. Only the scheduled "tick" function writes "state";
// visitor notes are separate keys so they never collide with it.
export const store = () => getStore({ name: "pino", consistency: "strong" });

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

export async function listNotes(): Promise<Note[]> {
  const s = store();
  const { blobs } = await s.list({ prefix: "notes/" });
  const keys = blobs.map((b) => b.key).sort().slice(0, 20);
  const notes: Note[] = [];
  for (const key of keys) {
    const n = (await s.get(key, { type: "json" })) as { text: string; at: number } | null;
    if (n?.text) notes.push({ key, text: n.text, at: n.at });
  }
  return notes;
}

export async function countNotes() {
  const { blobs } = await store().list({ prefix: "notes/" });
  return blobs.length;
}

export async function addNote(text: string) {
  const at = Date.now();
  const key = `notes/${at}-${Math.random().toString(36).slice(2, 8)}`;
  await store().setJSON(key, { text, at });
}

export async function deleteNote(key: string) {
  await store().delete(key);
}
