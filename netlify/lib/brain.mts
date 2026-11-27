// Pino's brain. Uses Claude if ANTHROPIC_API_KEY is set, otherwise OpenAI if
// OPENAI_API_KEY is set. Add keys in Netlify: Project configuration >
// Environment variables, scope "Functions", then redeploy.

export class NoBrain extends Error {}

const CLAUDE_MODELS = ["claude-haiku-5-5", "claude-haiku-4-5"];
const OPENAI_MODELS = ["gpt-6-luna", "gpt-5.4-nano"];

export function hasBrain() {
  return !!(Netlify.env.get("ANTHROPIC_API_KEY") || Netlify.env.get("OPENAI_API_KEY"));
}

let timeoutMs = 20_000;
let maxTokens = 500;
const timeout = () => AbortSignal.timeout(timeoutMs);

export type Img = { media_type: "image/jpeg" | "image/png"; data: string }; // base64
let images: Img[] = [];
async function askClaude(key: string, system: string, user: string) {
  const chosen = Netlify.env.get("ANTHROPIC_MODEL");
  let lastErr = "";
  for (const model of chosen ? [chosen] : CLAUDE_MODELS) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: images.length
        ? [...images.map((im) => ({ type: "image", source: { type: "base64", ...im } })), { type: "text", text: user }]
        : user }] }),
      signal: timeout(),
    });
    if (r.ok) {
      const j: any = await r.json();
      const text = (j?.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
      return { text, model };
    }
    const detail = (await r.text()).slice(0, 200);
    if (r.status === 401) throw new Error("Anthropic rejected the API key (401). Check ANTHROPIC_API_KEY in Netlify.");
    if (r.status === 404 || (r.status === 400 && /model/i.test(detail))) { lastErr = `Model ${model} not available`; continue; }
    if (r.status === 429 || r.status === 529) throw new Error(`Claude is busy or rate-limited (${r.status}). He'll try again in 5 minutes.`);
    if (r.status === 400 && /credit/i.test(detail)) throw new Error("Your Anthropic account is out of credit. Add some at console.anthropic.com.");
    throw new Error(`Anthropic ${r.status}: ${detail}`);
  }
  throw new Error(lastErr || "No Claude model worked");
}

async function askOpenAI(key: string, system: string, user: string) {
  const base = (Netlify.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
  const chosen = Netlify.env.get("OPENAI_MODEL");
  let lastErr = "";
  for (const model of chosen ? [chosen] : OPENAI_MODELS) {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
      signal: timeout(),
    });
    if (r.ok) {
      const j: any = await r.json();
      return { text: j?.choices?.[0]?.message?.content ?? "", model };
    }
    const detail = (await r.text()).slice(0, 200);
    if (r.status === 401) throw new Error("OpenAI rejected the API key (401). Check OPENAI_API_KEY in Netlify.");
    if (r.status === 404 || (r.status === 400 && /model/i.test(detail))) { lastErr = `Model ${model} not available`; continue; }
    throw new Error(`OpenAI ${r.status}: ${detail}`);
  }
  throw new Error(lastErr || "No OpenAI model worked");
}

// images: pictures for him to look at (what his eyes see, or a drawing he just finished) - Claude only
export async function ask(system: string, user: string, maxMs = 20_000, tokens = 500, imgs: Img[] = []): Promise<{ text: string; model: string }> {
  timeoutMs = maxMs;
  maxTokens = tokens;
  images = imgs;
  const claude = Netlify.env.get("ANTHROPIC_API_KEY");
  if (claude) return askClaude(claude, system, user);
  const openai = Netlify.env.get("OPENAI_API_KEY");
  if (openai) return askOpenAI(openai, system, user);
  throw new NoBrain("No brain connected yet: add ANTHROPIC_API_KEY in Netlify, then redeploy. Pino is running on instinct.");
}

// ---- looking things up on the web (Claude only): Anthropic's web search tool, limited to a few
// searches and to kids' and educational sites only. Returns the answer text and its sources.
export const SAFE_SITES = [
  // made for kids
  "kids.britannica.com", "kids.nationalgeographic.com", "natgeokids.com", "spaceplace.nasa.gov", "scijinks.gov",
  "dkfindout.com", "ducksters.com", "sciencekids.co.nz", "kiddle.co", "wonderopolis.org",
  // educational: encyclopedias, museums, science and nature organisations
  "simple.wikipedia.org", "britannica.com", "khanacademy.org", "nasa.gov", "si.edu", "amnh.org", "nhm.ac.uk",
  "metmuseum.org", "allaboutbirds.org", "audubon.org", "doc.govt.nz", "teara.govt.nz", "nps.gov", "worldwildlife.org",
];
export async function lookUp(system: string, user: string, maxMs = 25_000, tokens = 700) {
  const key = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new NoBrain("Looking things up needs a Claude brain (ANTHROPIC_API_KEY).");
  const model = Netlify.env.get("ANTHROPIC_MODEL") || CLAUDE_MODELS[0];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model, max_tokens: tokens, system, messages: [{ role: "user", content: user }],
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2, allowed_domains: SAFE_SITES }],
    }),
    signal: AbortSignal.timeout(maxMs),
  });
  if (!r.ok) {
    const detail = (await r.text()).slice(0, 300);
    if (/web.?search/i.test(detail) && /(disabled|not enabled|enable)/i.test(detail))
      throw new Error("Web search isn't switched on for this Anthropic account. Turn it on in the Claude Console (Settings > Privacy/Features), then Pino can look things up.");
    throw new Error(`Anthropic ${r.status}: ${detail}`);
  }
  const j: any = await r.json();
  const blocks: any[] = j?.content ?? [];
  const text = blocks.filter((c) => c.type === "text").map((c) => c.text).join("").trim();
  const sources = new Map<string, string>();
  for (const b of blocks) {
    for (const c of b.citations ?? []) if (c.url) sources.set(c.url, c.title ?? c.url);
    if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const res of b.content.slice(0, 3)) if (res.url && !sources.has(res.url)) sources.set(res.url, res.title ?? res.url);
  }
  const searches = blocks.filter((b) => b.type === "server_tool_use").map((b) => String(b.input?.query ?? "")).filter(Boolean);
  return { text, sources: [...sources].slice(0, 4).map(([url, title]) => ({ url, title })), searches };
}
