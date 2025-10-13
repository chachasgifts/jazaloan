// /api/generateProductCopy.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const { product, color, size, variant, price, category, generateSkus } =
      JSON.parse(event.body || "{}");

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." }),
      };
    }

    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);

    const prompt = `
You are an advanced AI trained in SEO copywriting for online marketplaces (Jumia, Amazon, Google Shopping).

**Goal:** Write persuasive, keyword-rich, SEO-optimized product listings that reflect real marketplace tone.

Main Product: "${mainProduct}"
${extras.length > 0 ? `Extra/Bundled Items: ${extras.join(", ")}` : ""}
Color: ${color || "Not specified"}
Size: ${size || "Not specified"}
Variant: ${variant || "Not specified"}
Category: ${category || "General"}
Price: ${price || "N/A"}

**Instructions:**
1️⃣ Title (60–70 characters)
${extras.length > 0 ? "- Include extras separated by a plus (+)." : "- Only include main product details."}
2️⃣ Highlights: 6–8 bullets (benefit-driven, keyword-optimized)
3️⃣ Description: 3 paragraphs (main product only ${
      extras.length > 0 ? "but mention the extra in paragraph 3" : ""
    })
4️⃣ What's in the Box: List all items clearly
5️⃣ Bold key product terms

Output only valid JSON:
{
 "title": "SEO optimized, 60–70 char product title",
 "highlights": ["H1","H2","H3","H4","H5","H6","H7","H8"],
 "description": "Three detailed, keyword-rich paragraphs",
 "whatsInTheBox": "Marketplace-style listing"
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 850,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only assistant that outputs valid structured data optimized for online marketplaces.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");

    const title =
      data.title ||
      `${mainProduct}${extras.length > 0 ? " + " + extras.join(" + ") : ""}`;

    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : ["High-quality build", "Optimized design", "Great value"];

    const description =
      data.description ||
      `The **${mainProduct}** delivers performance and value for everyday use.${
        extras.length > 0
          ? ` It also includes **${extras.join(
              " and "
            )}** — a thoughtful bonus to elevate your experience.`
          : ""
      }`;

    const whatsInTheBox =
      data.whatsInTheBox ||
      productParts.map((i) => `1 x ${i}`).join(", ");

    // 🧾 Optional SKU Generation
    let skuData = null;
    if (generateSkus) {
      const acronym = mainProduct
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3); // keep first 3 letters
      const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
      skuData = {
        format: `${acronym}-[Size]`,
        skus: sizes.map((sz) => ({ size: sz, sku: `${acronym}-${sz}` })),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        title,
        highlights,
        description,
        whatsInTheBox,
        skus: skuData,
      }),
    };
  } catch (error) {
    console.error("❌ FUNCTION ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
