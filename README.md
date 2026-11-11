# AI Storefront Builder

**Live demo:** https://ai-storefront-builder.vercel.app/

Made by Priyanka and Onkar Mhaske — built for the PayPal AI Hackathon 2026.

A seller describes their shop in a few words, and AI generates a complete online store — theme, colours, layout, product descriptions and prices. The seller previews it, edits the products, and customers buy through PayPal checkout.

## The problem

Small sellers, especially handmade makers, don't have the time or skills to build a good-looking online store. Hiring a developer is expensive, and drag-and-drop builders still ask the seller to do all the design work — pick colours, fonts, layout, write every product description.

## The solution

The seller only describes their shop. AI does the creative work:

- **AI does:** theme, colours, fonts, layout and overall look; which features the store has (e.g. "Today's drop" section, stock badges, gift bundle section); intro text, headings and product card style.
- **Seller does manually:** store name, add/delete products, and each product's name, photo, price, description and quantity.

Customers check out with PayPal, and stock goes down after each payment.

## What it can do

- **Describe your store** — type a short description, or tap a vibe chip (cozy & minimal, dark & moody, bright & playful, luxury & elegant, fresh & botanical). Click "Generate my store" and AI builds the store live.
- **Add products** — upload your own photos, or let AI create sample products. AI can look at a photo and write the product name, description and a suggested price.
- **Seller dashboard** — edit each product's photo, price, name, description and stock at any time. The live preview updates on every change.
- **Today's drop** — a section with only 2–5 limited-stock products. Each card shows photo, name, price, short description and an "Only X left" badge.
- **Stock protection** — stock 0 shows "Sold out" with buy disabled. Cart quantity can never go above stock.
- **Cart** — add items, change quantity, subtotal, shipping (free over $50), total.
- **PayPal checkout** — customers pay with PayPal. After payment, stock goes down.
- **Gift bundles and maker story** — optional sections the AI turns on when the seller asks for them.
- **Desktop / mobile preview** — see how the store looks on a computer and on a phone.
- **View store JSON** — see exactly what the AI generated.

## How to run it

### Option 1 — Just open the file (demo, AI uses an offline fallback)

Open `index.html` in a browser. The store works with sample products. Live AI generation calls `/api/generate` on the server — see Option 2; if that call fails, the page shows a sample store and says so.

### Option 2 — Deploy on Vercel (live, with real AI)

1. Put this folder in a public GitHub repo.
2. Import the repo in Vercel and deploy.
3. In Vercel → Settings → Environment Variables, add `GROQ_API_KEY` (free key from https://console.groq.com).
4. Redeploy. `index.html` is the app; `api/generate.js` and `api/describe-photo.js` are the AI routes.

## AI tools used

- **Groq** — `openai/gpt-oss-120b` for store generation (design, products, prices), and `meta-llama/llama-4-scout-17b-16e-instruct` for writing product name/description from a photo.
- The AI returns structured JSON, which the frontend validates and renders as a store. No invented certifications, medical claims or awards.

## PayPal

- Checkout is built for the **PayPal sandbox** Orders flow. Create a sandbox app at https://developer.paypal.com (Dashboard → My Apps & Credentials → Sandbox → Create App, type Merchant).
- In the single-file demo, the PayPal checkout is simulated in the browser — no real money moves. Connecting a real sandbox needs a small serverless step that calls the PayPal Orders API with the sandbox Client ID and Secret (set them as environment variables in Vercel, never in the repo).
- The "Debit or Credit Card" option was removed — checkout is PayPal only.

## Files

- `index.html` — the whole app (builder + live store preview + cart + PayPal checkout)
- `api/generate.js` — AI route: seller description → store JSON
- `api/describe-photo.js` — AI route: product photo → name, description, suggested price
- `api/_llm.js` — shared helper that calls the Groq API
- `package.json`, `.env.example`

## Licence

MIT — see `LICENSE`.
