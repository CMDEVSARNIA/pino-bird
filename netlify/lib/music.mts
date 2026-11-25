// Songs on Pino's gramophone. The page plays them with its own little synthesizer
// (public/index.html, SONG_NOTES), so there are no recordings to license: every
// melody is either a public-domain composition or an original written for Pino.
export type Song = { id: string; title: string; by: string };

export const SONGS: Song[] = [
  { id: "ode", title: "Ode to Joy", by: "Ludwig van Beethoven (1824)" },
  { id: "elise", title: "Für Elise", by: "Ludwig van Beethoven (1810)" },
  { id: "canon", title: "Canon in D", by: "Johann Pachelbel (c. 1680)" },
  { id: "minuet", title: "Minuet in G", by: "Christian Petzold (1725)" },
  { id: "twinkle", title: "Twinkle, Twinkle, Little Star", by: "Traditional" },
  { id: "jacques", title: "Frère Jacques", by: "Traditional" },
  { id: "rowboat", title: "Row, Row, Row Your Boat", by: "Traditional" },
  { id: "waltz", title: "Pino's Morning Waltz", by: "an original for Pino's Town" },
  { id: "shuffle", title: "Seed Cake Shuffle", by: "an original for Pino's Town" },
  { id: "rain", title: "Library Rain", by: "an original for Pino's Town" },
];
export const SONG_BY_ID: Record<string, Song> = Object.fromEntries(SONGS.map((s) => [s.id, s]));

export type Music = { on: boolean; song: string; since: number };
export const silence = (): Music => ({ on: false, song: "", since: 0 });

export function nextSong(current: string) {
  const i = SONGS.findIndex((s) => s.id === current);
  return SONGS[(i + 1) % SONGS.length].id;
}
export const randomSong = () => SONGS[Math.floor(Math.random() * SONGS.length)].id;
