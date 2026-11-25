import type { Config } from "@netlify/functions";
import { publicView } from "../lib/pino.mts";
import { addNote, countNotes, loadState } from "../lib/store.mts";

// GET  /api/state   -> what the viewer page shows
// POST /api/message -> leave Pino a note ({"text": "..."})
export default async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "GET" && url.pathname === "/api/state") {
    const [s, unread] = await Promise.all([loadState(), countNotes()]);
    return Response.json(publicView(s, unread, Date.now()), { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "POST" && url.pathname === "/api/message") {
    let text = "";
    try {
      const body = await req.json();
      text = String(body?.text ?? "").replace(/\s+/g, " ").trim().slice(0, 300);
    } catch { /* bad body */ }
    if (!text) return Response.json({ ok: false, error: "Write something first." }, { status: 400 });
    if ((await countNotes()) >= 20) {
      return Response.json({ ok: false, error: "Pino's mailbox is full. Try again later." }, { status: 429 });
    }
    await addNote(text);
    return Response.json({ ok: true });
  }

  return new Response("Not found", { status: 404 });
};

export const config: Config = {
  path: ["/api/state", "/api/message"],
  method: ["GET", "POST"],
};
