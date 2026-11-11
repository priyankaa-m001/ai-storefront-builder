const { chatJSON, guard, str, pick, num } = require("./_llm");

const PALETTES = ["ember", "forest", "noir", "candy", "royal", "pastel"];
const FONTS = ["serif", "modern", "warm"];
const LAYOUTS = ["grid", "editorial", "list"];
const CARDS = ["Soft & rounded cards", "Sharp editorial cards", "Chunky rounded cards", "Clean minimal cards"];
const CATS = ["crochet", "candles", "skincare", "soap", "bakery", "jewelry", "flowers", "plants", "coffee", "books", "toys", "clothing", "other"];

const SYSTEM = `You design small online shops. Given a seller's description, return ONE JSON object and nothing else:
{
  "name": string (store name, max 40 chars; use the seller's name if given),
  "category": one of ${JSON.stringify(CATS)} (closest match for the main product type),
  "tagline": string (max 90 chars),
  "intro": string (1-2 sentences, max 260 chars),
  "sectionTitle": string (max 30 chars, e.g. "The collection"),
  "storyTitle": string (max 60 chars),
  "storyText": string (2-3 sentences, max 380 chars, first person only if the seller is a maker),
  "signature": string (max 40 chars, e.g. "— Priya, maker"),
  "palette": one of ${JSON.stringify(PALETTES)},
  "font": one of ${JSON.stringify(FONTS)},
  "layout": one of ${JSON.stringify(LAYOUTS)},
  "cardStyle": one of ${JSON.stringify(CARDS)},
  "features": { "todaysDrop": bool, "stockBadges": bool, "giftBundle": bool, "story": bool },
  "products": [ { "name": string, "description": string (max 160 chars), "price": number in USD, "badge": string (max 18 chars, may be ""), "stock": integer 1-20 } ]  // 3 to 5 products
}
Rules: match the mood words (dark/moody -> noir, bright/playful -> candy, luxury -> royal + serif, botanical -> forest, pastel/cozy -> pastel/ember). Turn on only features the seller asked for or clearly implied. If the seller wants limited stock, use small stock numbers. Prices must be realistic for handmade/small-batch goods. Do not invent certifications, medical claims, or awards. IMPORTANT: products must be the actual items the seller sells, using the seller's exact product words. If the seller sells soap, every product must be a soap product (soap bars, soap sets) named with its scent/ingredients — never generic skincare like serum, moisturiser, toner or face oil. If the seller sells candles, products must be candles. If the seller sells flowers, every product must be a flower product (bouquets, bunches, arrangements) named with the flower type — never candles, soap or skincare. If the seller sells plants, coffee, books, toys or clothing, every product must be those items — never candles. The store name, tagline and intro must also name the actual product type the seller sells.`;

module.exports = async (req, res) => {
  if (!guard(req, res)) return;
  try {
    const prompt = str(req.body?.prompt, 800);
    const shopName = str(req.body?.shopName, 40);
    if (prompt.length < 8) return res.status(400).json({ error: "Describe your store in a few words" });

    const raw = await chatJSON({
      model: process.env.TEXT_MODEL || "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Store name (may be empty): ${shopName || "(none)"}\nSeller description: ${prompt}` },
      ],
    });

    const f = raw.features || {};
    const products = (Array.isArray(raw.products) ? raw.products : []).slice(0, 6).map((p) => ({
      name: str(p.name, 60, "New product"),
      desc: str(p.description, 200, ""),
      price: Math.round(num(p.price, 1, 500, 20) * 100) / 100,
      badge: str(p.badge, 18),
      stock: Math.round(num(p.stock, 1, 20, 3)),
    })).filter((p) => p.name);

    if (products.length < 2) return res.status(502).json({ error: "AI returned too few products" });

    res.status(200).json({
      name: str(raw.name, 40, shopName || "My Store"),
      category: pick(raw.category, CATS, "other"),
      tagline: str(raw.tagline, 100),
      intro: str(raw.intro, 300),
      sectionTitle: str(raw.sectionTitle, 30, "The collection"),
      storyTitle: str(raw.storyTitle, 70),
      storyText: str(raw.storyText, 420),
      signature: str(raw.signature, 40),
      palette: pick(raw.palette, PALETTES, "ember"),
      font: pick(raw.font, FONTS, "warm"),
      layout: pick(raw.layout, LAYOUTS, "grid"),
      cardStyle: pick(raw.cardStyle, CARDS, CARDS[0]),
      features: {
        todaysDrop: !!f.todaysDrop,
        stockBadges: !!f.stockBadges,
        giftBundle: !!f.giftBundle,
        story: !!f.story,
      },
      products,
    });
  } catch (e) {
    console.error("generate failed:", e.message);
    res.status(502).json({ error: "AI generation failed: " + String(e.message || e).slice(0, 200) });
  }
};
