// Pino's sight. Two ways he gets to really look at things:
//  1. his eyes: friends' phones draw a small picture of his 3D world from where he's standing and send it
//     (only people he knows; he's told to ignore anything that doesn't look like his town);
//  2. his drawings: when he finishes one, the server turns it into a picture so he sees how it really came out.
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import type { Img } from "./brain.mts";

import { toB64 } from "./b64.mts";

let ready: Promise<void> | null = null;
const WASM = "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
// the picture-maker (resvg) ships with the functions; if it can't be found there, fetch it from the CDN
async function localWasm(): Promise<Uint8Array | null> {
  try {
    const fs: any = await import("node:fs/promises" as string), path: any = await import("node:path" as string), cwd: string = (globalThis as any).process?.cwd?.() ?? "/var/task";
    const rel = "node_modules/@resvg/resvg-wasm/index_bg.wasm";
    for (const base of [cwd, path.resolve(cwd, ".."), "/var/task"]) {
      try { return new Uint8Array(await fs.readFile(path.join(base, rel))); } catch {}
    }
  } catch {}
  return null;
}
async function boot() {
  ready ??= (async () => {
    const local = await localWasm();
    if (local) return initWasm(local);
    const r = await fetch(WASM, { signal: AbortSignal.timeout(8000) }); if (!r.ok) throw new Error(`resvg ${r.status}`); await initWasm(r);
  })().catch((e) => { ready = null; throw e; });
  return ready;
}
// a drawing (SVG) as a PNG he can look at
export async function drawingImage(svg: string): Promise<Img> {
  await boot();
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 512 }, background: "#fffdf6" }).render().asPng();
  return { media_type: "image/png", data: toB64(png) };
}

export { EYES_FRESH_MS, EYES_MAX_BYTES } from "./b64.mts";
export const eyesPrompt = "\nYour own eyes: the picture above is what you can see right now, from where you're standing, looking ahead (your beak may poke into the bottom of the view). " +
  "Notice real things in it - colours, light, the weather, what's around you - and let them shape your thoughts. If it's blank, too dark to make out, or doesn't look like your town, just ignore it.\n";
