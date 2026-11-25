// Talks to OpenAI. Set OPENAI_API_KEY (and optionally OPENAI_MODEL) in
// Netlify: Project configuration > Environment variables, scope "Functions".

export class NoBrain extends Error {}

const FALLBACK_MODELS = ["gpt-6-luna", "gpt-5.4-nano", "gpt-5.4-mini"];

export function brainName() {
  return Netlify.env.get("OPENAI_MODEL") || FALLBACK_MODELS[0];
}

async function call(base: string, key: string, model: string, system: string, user: string, json: boolean) {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  };
  if (json) body.response_format = { type: "json_object" };
  return fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
}

export async function ask(system: string, user: string): Promise<{ text: string; model: string }> {
  const key = Netlify.env.get("OPENAI_API_KEY");
  if (!key) throw new NoBrain("No brain connected yet: add OPENAI_API_KEY in Netlify, then redeploy. Pino is running on instinct.");
  const base = (Netlify.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
  const chosen = Netlify.env.get("OPENAI_MODEL");
  const models = chosen ? [chosen] : FALLBACK_MODELS;

  let lastErr = "";
  for (const model of models) {
    let r = await call(base, key, model, system, user, true);
    if (r.status === 400) {
      const detail = await r.text();
      if (/response_format/i.test(detail)) r = await call(base, key, model, system, user, false);
      else { lastErr = `OpenAI 400 (${model}): ${detail.slice(0, 200)}`; if (/model/i.test(detail)) continue; throw new Error(lastErr); }
    }
    if (r.status === 404) { lastErr = `Model ${model} not available`; continue; }
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 200);
      if (r.status === 401) throw new Error("OpenAI rejected the API key (401). Check OPENAI_API_KEY in Netlify.");
      if (r.status === 429) throw new Error(`OpenAI says slow down or out of credit (429): ${detail}`);
      throw new Error(`OpenAI ${r.status}: ${detail}`);
    }
    const j: any = await r.json();
    return { text: j?.choices?.[0]?.message?.content ?? "", model };
  }
  throw new Error(lastErr || "No OpenAI model worked");
}
