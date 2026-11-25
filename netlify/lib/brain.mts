// Pino's brain. Uses Claude if ANTHROPIC_API_KEY is set, otherwise OpenAI if
// OPENAI_API_KEY is set. Add keys in Netlify: Project configuration >
// Environment variables, scope "Functions", then redeploy.

export class NoBrain extends Error {}

const CLAUDE_MODELS = ["claude-haiku-5-5", "claude-haiku-4-5"];
const OPENAI_MODELS = ["gpt-6-luna", "gpt-5.4-nano"];

export function hasBrain() {
  return !!(Netlify.env.get("ANTHROPIC_API_KEY") || Netlify.env.get("OPENAI_API_KEY"));
}

const timeout = () => AbortSignal.timeout(20_000);

async function askClaude(key: string, system: string, user: string) {
  const chosen = Netlify.env.get("ANTHROPIC_MODEL");
  let lastErr = "";
  for (const model of chosen ? [chosen] : CLAUDE_MODELS) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 500, system, messages: [{ role: "user", content: user }] }),
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

export async function ask(system: string, user: string): Promise<{ text: string; model: string }> {
  const claude = Netlify.env.get("ANTHROPIC_API_KEY");
  if (claude) return askClaude(claude, system, user);
  const openai = Netlify.env.get("OPENAI_API_KEY");
  if (openai) return askOpenAI(openai, system, user);
  throw new NoBrain("No brain connected yet: add ANTHROPIC_API_KEY in Netlify, then redeploy. Pino is running on instinct.");
}
