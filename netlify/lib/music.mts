// Songs on Pino's gramophone. The page plays them with its own little synthesizer
// (public/index.html, SONG_NOTES), so there are no recordings to license: every
// melody is either a public-domain composition or an original written for Pino.
export type Song = { id: string; title: string; by: string; gift?: boolean };

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
  // records visitors can give him
  { id: "jingle", title: "Jingle Bells", by: "James Lord Pierpont (1857)", gift: true },
  { id: "birthday", title: "Happy Birthday", by: "Mildred & Patty Hill (1893)", gift: true },
  { id: "lullaby", title: "Brahms' Lullaby", by: "Johannes Brahms (1868)", gift: true },
  { id: "greensleeves", title: "Greensleeves", by: "Traditional", gift: true },
  { id: "morning", title: "Morning Mood", by: "Edvard Grieg (1875)", gift: true },
  { id: "polka", title: "Puddle Jump Polka", by: "an original for Pino's Town", gift: true },
  { id: "starlight", title: "Starlight Over the Pond", by: "an original for Pino's Town", gift: true },
  { id: "trainride", title: "The Little Train Home", by: "an original for Pino's Town", gift: true },
];
export const SONG_BY_ID: Record<string, Song> = Object.fromEntries(SONGS.map((s) => [s.id, s]));

export type Music = { on: boolean; song: string; since: number };
export const silence = (): Music => ({ on: false, song: "", since: 0 });

// Songs he has: the built-in ones plus records he's been given
export const songsOwned = (received: string[]) => SONGS.filter((s) => !s.gift || received.includes(`song-${s.id}`));
export function nextSong(current: string, received: string[] = []) {
  const list = songsOwned(received);
  const i = list.findIndex((s) => s.id === current);
  return list[(i + 1) % list.length].id;
}
export const randomSong = (received: string[] = []) => { const l = songsOwned(received); return l[Math.floor(Math.random() * l.length)].id; };
