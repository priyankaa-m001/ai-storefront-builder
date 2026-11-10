// Shared helpers for the serverless routes (files starting with "_" are not exposed as routes).
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function chatJSON({ messages, model, maxTokens = 1400, temperature = 0.7 }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set");
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!r.ok) throw new Error(`LLM ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const data = await r.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(text);
}

// Best-effort per-IP rate limit (resets when the function instance recycles).
// For real protection add Vercel Firewall rate limiting or Upstash.
const hits = new Map();
function rateLimited(req, max = 12, windowMs = 60_000) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

// Returns true if the request may continue.
function guard(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN; // e.g. https://your-app.vercel.app
  if (allowed && req.headers.origin && req.headers.origin !== allowed) {
    res.status(403).json({ error: "Origin not allowed" });
    return false;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return false;
  }
  if (rateLimited(req)) {
    res.status(429).json({ error: "Too many requests, try again in a minute" });
    return false;
  }
  return true;
}

const str = (v, max, fb = "") => (typeof v === "string" ? v.trim().slice(0, max) : fb);
const pick = (v, list, fb) => (list.includes(v) ? v : fb);
const num = (v, min, max, fb) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
};

module.exports = { chatJSON, guard, str, pick, num };
