// Pino's garden, to the left of his house: two raised beds (six plots) under a glass cold frame,
// so things grow all year. Visitors buy him seed packets; he plants, waters and harvests them himself.
// Plants grow in real time, but only while they've been watered in the last day (rain counts!).

export type Crop = { id: string; name: string; plural: string; emoji: string; hours: number; food: number; flower?: boolean };
export const CROPS: Record<string, Crop> = {
  carrot: { id: "carrot", name: "carrot", plural: "carrots", emoji: "🥕", hours: 24, food: 18 },
  strawberry: { id: "strawberry", name: "strawberry", plural: "strawberries", emoji: "🍓", hours: 36, food: 14 },
  tomato: { id: "tomato", name: "tomato", plural: "tomatoes", emoji: "🍅", hours: 48, food: 16 },
  pumpkin: { id: "pumpkin", name: "pumpkin", plural: "pumpkins", emoji: "🎃", hours: 72, food: 30 },
  sunflower: { id: "sunflower", name: "sunflower", plural: "sunflowers", emoji: "🌻", hours: 48, food: 0, flower: true },
  tulip: { id: "tulip", name: "tulip", plural: "tulips", emoji: "🌷", hours: 30, food: 0, flower: true },
};
export const PLOTS = 6;
const THIRSTY_H = 12, DRY_H = 24;

export type Plot = { crop: string; planted: number; watered: number; growth: number } | null; // growth in hours
export type Garden = { plots: Plot[]; packets: Record<string, number>; harvested: Record<string, number>; lastGrow: number; vase: number };
export const newGarden = (now: number): Garden => ({ plots: Array(PLOTS).fill(null), packets: {}, harvested: {}, lastGrow: now, vase: 0 });

export const progress = (p: NonNullable<Plot>) => Math.min(1, p.growth / (CROPS[p.crop]?.hours ?? 48));
export const ready = (p: Plot) => !!p && progress(p) >= 1;
export const thirsty = (p: Plot, now: number) => !!p && !ready(p) && now - p.watered > THIRSTY_H * 3_600_000;
export function stageWord(p: NonNullable<Plot>) {
  const f = progress(p), c = CROPS[p.crop];
  return f >= 1 ? (c.flower ? `${c.plural} in full bloom` : `ripe ${c.plural}, ready to pick`)
    : f >= 0.7 ? `${c.name} almost ready` : f >= 0.35 ? `a little ${c.name} plant` : f >= 0.1 ? `a ${c.name} sprout` : `a freshly planted ${c.name} seed`;
}

// Let time pass in the garden (called every moment). Rain waters everything for him.
export function grow(g: Garden, now: number, raining: boolean) {
  const hours = Math.max(0, Math.min(6, (now - (g.lastGrow || now)) / 3_600_000));
  g.lastGrow = now;
  for (const p of g.plots) {
    if (!p) continue;
    if (raining) p.watered = now;
    if (now - p.watered < DRY_H * 3_600_000 && !ready(p)) p.growth += hours;
  }
}

// What he can do in the garden right now: [activity, effects]
export function gardenActivities(g: Garden, now: number): Record<string, { food?: number; energy?: number; joy?: number }> {
  const acts: Record<string, { food?: number; energy?: number; joy?: number }> = { "look at my garden": { joy: 4, energy: 1 } };
  const free = g.plots.some((p) => !p);
  if (free) for (const c of Object.values(CROPS)) if ((g.packets[c.id] ?? 0) > 0) acts[`plant a ${c.name} seed`] = { joy: 8, energy: -2, food: -1 };
  if (g.plots.some((p) => thirsty(p, now) || (p && now - p.watered > 6 * 3_600_000 && !ready(p)))) acts["water my garden"] = { joy: 5, energy: -3, food: -1 };
  for (const c of new Set(g.plots.filter(ready).map((p) => p!.crop))) {
    const crop = CROPS[c];
    acts[crop.flower ? `pick the ${crop.plural} for a vase at home` : `harvest and eat my ${crop.plural}`] = crop.flower ? { joy: 14 } : { food: crop.food, joy: 12 };
  }
  return acts;
}

// Carry out a garden activity; returns a short note on what happened (or "")
export function doGarden(g: Garden, action: string, now: number): string {
  const plant = action.match(/^plant a (\w+) seed$/);
  if (plant) {
    const c = CROPS[plant[1]], i = g.plots.findIndex((p) => !p);
    if (!c || i < 0 || !(g.packets[c.id] > 0)) return "";
    g.packets[c.id] -= 1;
    g.plots[i] = { crop: c.id, planted: now, watered: now, growth: 0 };
    return `planted a ${c.name} seed in plot ${i + 1} and gave it a drink`;
  }
  if (action === "water my garden") {
    let n = 0; for (const p of g.plots) if (p && !ready(p)) { p.watered = now; n++; }
    return `watered ${n} plant${n === 1 ? "" : "s"}`;
  }
  const pick = action.match(/^(?:pick the|harvest and eat my) (\w+)/);
  if (pick) {
    const c = Object.values(CROPS).find((x) => x.plural === pick[1]); if (!c) return "";
    let n = 0;
    g.plots = g.plots.map((p) => (p && p.crop === c.id && ready(p) ? (n++, null) : p));
    g.harvested[c.id] = (g.harvested[c.id] ?? 0) + n;
    if (c.flower) g.vase += n;
    return c.flower ? `picked ${n} ${n === 1 ? c.name : c.plural} and put them in a vase at home` : `harvested ${n} ${n === 1 ? c.name : c.plural} and ate them`;
  }
  return "";
}

export function gardenLine(g: Garden | undefined, now: number) {
  if (!g) return "two raised garden beds under a glass cold frame, all empty - you have no seeds yet (visitors can buy you seed packets)";
  const growing = g.plots.filter(Boolean).map((p) => stageWord(p!) + (thirsty(p, now) ? " (thirsty!)" : ""));
  const packets = Object.entries(g.packets).filter(([, n]) => n > 0).map(([c, n]) => `${n} ${n === 1 ? CROPS[c].name : CROPS[c].plural}`);
  return `two raised beds under a glass cold frame (${PLOTS} plots): ${growing.length ? growing.join(", ") : "nothing planted yet"}` +
    `; seed packets in your pocket: ${packets.length ? packets.join(", ") : "none (visitors can buy you more)"}` +
    (g.vase ? `; ${g.vase} flowers from your garden are in a vase at home` : "");
}

export function gardenView(g: Garden | undefined, now: number) {
  if (!g) return null;
  return {
    plots: g.plots.map((p) => (p ? { crop: p.crop, stage: Math.round(progress(p) * 100) / 100, thirsty: thirsty(p, now), ready: ready(p) } : null)),
    packets: g.packets, harvested: g.harvested, vase: g.vase,
  };
}
