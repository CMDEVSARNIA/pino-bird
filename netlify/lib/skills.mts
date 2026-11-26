// Skills: the more Pino does something, the better he gets at it.
// Every time he practises, that skill gains a point. Levels make practised things more rewarding and
// less tiring, and some skills change what happens (a skilled gardener's plants grow faster, a skilled
// researcher digs deeper, a practised artist's hand is steadier).

export type Skill = { id: string; name: string; emoji: string; re: RegExp; perk: string };

export const SKILLS: Skill[] = [
  { id: "museum", name: "Museum smarts", emoji: "🏛️", re: /exhibit|museum/, perk: "understanding the exhibits" }, // first, so "the exhibit: Moon rock" isn't stargazing
  { id: "drawing", name: "Drawing & painting", emoji: "🎨", re: /draw|paint|sketch|watercolou?r|doodle/, perk: "a steadier hand and better pictures" },
  { id: "writing", name: "Writing", emoji: "✏️", re: /journal|letter|wrote|write|replied|reply/, perk: "richer journal entries and letters" },
  { id: "reading", name: "Reading", emoji: "📖", re: /^read |reading nook|story|poem/, perk: "understanding books more deeply" },
  { id: "research", name: "Research", emoji: "🔍", re: /look something up|library computer|searching online/, perk: "deeper questions and more facts per look-up" },
  { id: "gardening", name: "Gardening", emoji: "🌱", re: /garden|plant|sow|water the|weed|harvest|pick the/, perk: "plants grow faster" },
  { id: "music", name: "Music", emoji: "🎵", re: /harmonica|sing|hum|whistle|gramophone|dance/, perk: "tunes that sound like real tunes" },
  { id: "stars", name: "Stargazing", emoji: "🔭", re: /telescope|star|constellation|moon/, perk: "spotting more in the night sky" },
  { id: "puzzles", name: "Puzzles", emoji: "🧩", re: /jigsaw|puzzle/, perk: "finding where pieces go" },
  { id: "play", name: "Play & sport", emoji: "🛷", re: /sled|swing|slide|skip|puddle|snow-kiwi|snowball|chase|hop|splash|train|kick|flop/, perk: "more fun, less tiring" },
  { id: "nature", name: "Nature watching", emoji: "🐦", re: /pond|bird|feeder|leaf|leaves|bug|beetle|flower|tree|worm|cloud|rain|snowflake/, perk: "noticing more of nature" },
  { id: "decorating", name: "Decorating", emoji: "🛋️", re: /furniture|hang my drawing|hung my drawing|tidy|arrange/, perk: "cosier rooms" },
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((k) => [k.id, k]));

export const LEVELS = ["New to it", "Beginner", "Learning", "Getting good", "Skilled", "Expert", "Master"];
const AT = [0, 1, 5, 15, 35, 70, 120]; // practice needed for each level
export const levelOf = (xp: number) => { let l = 0; for (let i = 0; i < AT.length; i++) if (xp >= AT[i]) l = i; return l; };
export const nextAt = (xp: number) => AT[levelOf(xp) + 1] ?? null;

// Which skill (if any) an action practises. Walking, eating and sleeping don't build skills.
export function skillFor(action: string): Skill | null {
  const a = action.toLowerCase();
  if (/^(walked|sleep|take a nap|nap|get |eat|drink|have a |reflected)/.test(a)) return null;
  return SKILLS.find((k) => k.re.test(a)) ?? null;
}

// He's been living for a while already: count what he's done so far so his skills start where they should.
export function skillsFromHistory(tried: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [action, n] of Object.entries(tried ?? {})) {
    const k = skillFor(action);
    if (k) out[k.id] = (out[k.id] ?? 0) + n;
  }
  return out;
}

export function skillLines(skills: Record<string, number>) {
  const have = SKILLS.filter((k) => (skills[k.id] ?? 0) > 0).sort((a, b) => (skills[b.id] ?? 0) - (skills[a.id] ?? 0));
  if (!have.length) return "";
  return "Your skills (they grow every time you practise - the more you do something, the better you get):\n" +
    have.map((k) => `- ${k.name}: ${LEVELS[levelOf(skills[k.id])]} (level ${levelOf(skills[k.id])} of 6)`).join("\n");
}

export function skillsView(skills: Record<string, number>) {
  return SKILLS.filter((k) => (skills[k.id] ?? 0) > 0).map((k) => {
    const xp = skills[k.id], lvl = levelOf(xp), next = nextAt(xp);
    return { id: k.id, name: k.name, emoji: k.emoji, xp, level: lvl, label: LEVELS[lvl], next, from: AT[lvl], perk: k.perk };
  }).sort((a, b) => b.xp - a.xp);
}
