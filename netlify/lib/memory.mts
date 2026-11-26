// Memory recall: when something comes up, Pino searches everything he has ever
// saved (diary, journal, reading reactions, drawings, insights, letters) and the
// most relevant older memories "come to mind". Simple keyword matching weighted
// by how rare each word is, so "trains" finds train memories but "the" finds nothing.
import type { State } from "./pino.mts";

type Item = { when: string; kind: string; text: string; boost: number; recentRank: number };

const STOP = new Set(("the a an and or but of to in on at for with from by is are was were be been it its this that these those i me my you your " +
  "he she they we our us his her them so just very really then than too can could would should will about into over after before " +
  "what when where who how why all any some more most much many one two not no yes do did does have has had get got make made " +
  "feel felt like little bit right now here there today want wanted think thought maybe also still again way thing things").split(" "));

function stem(w: string) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s")) return w.slice(0, -1);
  return w;
}
export function terms(text: string) {
  return [...new Set(text.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").split(/\s+/)
    .map((w) => w.replace(/'s?$/, "")).filter((w) => w.length >= 3 && !STOP.has(w)).map(stem))];
}

function items(s: State, skipRecent: number): Item[] {
  const out: Item[] = [];
  const mem = s.memories.slice(0, Math.max(0, s.memories.length - skipRecent));
  mem.forEach((m, i) => out.push({
    when: m.t, kind: "diary",
    text: `at the ${m.place}: ${m.action}. I thought: "${m.thought}"`,
    boost: (m.first ? 0.3 : 0) + (m.brain === "visitor" ? 0.3 : 0), recentRank: mem.length - i,
  }));
  (s.journal ?? []).forEach((j) => out.push({ when: j.t, kind: "my journal", text: j.text, boost: 0.4, recentRank: 50 }));
  (s.readingLog ?? []).forEach((r) => out.push({ when: r.t, kind: "reading", text: `${r.title}, page ${r.page}: ${r.reaction}`, boost: 0.2, recentRank: 50 }));
  (s.museumLog ?? []).forEach((m) => out.push({ when: m.t, kind: "museum", text: `at the museum, looking at ${m.name}: ${m.reaction}`, boost: 0.2, recentRank: 50 }));
  (s.drawings ?? []).forEach((d) => out.push({ when: d.t, kind: "a drawing I made", text: `${d.title ?? "untitled"} - ${d.text}${d.lesson ? ` (note to self: ${d.lesson})` : ""}`, boost: 0.3, recentRank: 50 }));
  (s.insights ?? []).forEach((n) => out.push({ when: n.t, kind: "something I realised", text: n.text, boost: 0.4, recentRank: 50 }));
  (s.conversations ?? []).forEach((c) => out.push({ when: c.t, kind: "a letter", text: `someone wrote "${c.visitor}" and I wrote back "${c.reply}"`, boost: 0.3, recentRank: 50 }));
  (s.gifts?.log ?? []).forEach((g) => out.push({ when: g.t, kind: "a gift", text: `${g.from} gave me ${g.name}`, boost: 0.5, recentRank: 50 }));
  (s.knowledge ?? []).forEach((k) => out.push({ when: k.t, kind: "something I learned", text: `${k.topic} - ${k.fact}`, boost: 0.4, recentRank: 50 }));
  return out;
}

// Returns a few lines of older memories related to `cue`, or "" if nothing fits.
export function recall(s: State, cue: string, k = 4, skipRecent = 8): string {
  const want = terms(cue);
  if (!want.length) return "";
  const all = items(s, skipRecent);
  if (!all.length) return "";
  const docs = all.map((it) => new Set(terms(it.text)));
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d) df.set(t, (df.get(t) ?? 0) + 1);
  const N = all.length;
  const scored = all.map((it, i) => {
    let score = 0, hits = 0;
    for (const t of want) if (docs[i].has(t)) { score += Math.log(1 + N / (df.get(t) ?? 1)); hits++; }
    if (!hits) return { it, score: 0 };
    score = score / Math.sqrt(1 + docs[i].size / 12) + it.boost + 0.3 / (1 + it.recentRank / 40);
    return { it, score };
  }).filter((x) => x.score > 1.2).sort((a, b) => b.score - a.score);

  const seen = new Set<string>(); const picked: Item[] = [];
  for (const { it } of scored) {
    const key = it.text.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key); picked.push(it);
    if (picked.length >= k) break;
  }
  return picked.map((it) => `- [${it.when}] (${it.kind}) ${it.text.slice(0, 260)}`).join("\n");
}

// Just his research: facts he's learned that match a cue (for answering visitors' questions)
export function recallKnowledge(s: State, cue: string, k = 3): string {
  const want = terms(cue);
  if (!want.length || !(s.knowledge ?? []).length) return "";
  return s.knowledge!.map((f) => {
    const have = new Set(terms(`${f.topic} ${f.fact}`));
    return { f, hits: want.filter((t) => have.has(t)).length };
  }).filter((x) => x.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, k).map((x) => `- ${x.f.fact}`).join("\n");
}
