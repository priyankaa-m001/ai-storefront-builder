const { chatJSON, guard, str, num } = require("./_llm");

const SYSTEM = `You write product listings for a small online shop from ONE product photo. Return ONE JSON object only:
{ "name": string (max 50 chars), "description": string (max 160 chars), "price": number in USD, "badge": string (max 18 chars or ""), "looksLikeProduct": boolean }
Rules: describe ONLY what is visible (colour, shape, style, apparent material). Do not claim organic, handmade, tarnish-resistant, hypoallergenic, dermatologist-tested, or any certification unless the seller's note says so. Suggest a realistic small-shop price. If the photo is not a product, set looksLikeProduct to false.`;

module.exports = async (req, res) => {
  if (!guard(req, res)) return;
  try {
    const image = req.body?.image;
    if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image) || image.length > 1_500_000) {
      return res.status(400).json({ error: "Send a JPEG/PNG/WebP data URL under ~1MB" });
    }
    const shop = str(req.body?.shopContext, 200);
    const hint = str(req.body?.hint, 60);

    const raw = await chatJSON({
      model: process.env.VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
      maxTokens: 400,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: `Shop context: ${shop || "general handmade shop"}. File name hint: ${hint || "none"}.` },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });

    res.status(200).json({
      name: str(raw.name, 60, "New product"),
      desc: str(raw.description, 200),
      price: Math.round(num(raw.price, 1, 500, 20) * 100) / 100,
      badge: str(raw.badge, 18),
      looksLikeProduct: raw.looksLikeProduct !== false,
    });
  } catch (e) {
    console.error("describe-photo failed:", e.message);
    res.status(502).json({ error: "Photo analysis failed" });
  }
};
