// The town museum: real treasures from around the world, each with a true plaque.
// The same list (public/museum.json) is drawn by the viewer page inside the museum.
import exhibits from "../../public/museum.json" with { type: "json" };

export type Exhibit = { id: string; hall: string; name: string; by: string; fact: string; wiki?: string };
export const EXHIBITS: Exhibit[] = exhibits as Exhibit[];
export const EXHIBIT_BY_ID: Record<string, Exhibit> = Object.fromEntries(EXHIBITS.map((e) => [e.id, e]));

// What he does in the museum: "see the exhibit: The Starry Night"
export const exhibitAction = (e: Exhibit) => `see the exhibit: ${e.name}`;
export const exhibitFromAction = (action: string) => EXHIBITS.find((e) => action === exhibitAction(e));

export const HALLS: Record<string, string> = {
  paintings: "a hall of famous paintings",
  "natural history": "a natural history hall with a dinosaur skeleton",
  history: "a history and inventions hall",
  space: "a space hall with a tall rocket",
};
