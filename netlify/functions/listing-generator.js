import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const {
      product,
      color: primaryVariant, // now clearly only the first variant for AI
      allVariants = [], // new field for all variants (used for SKU table)
      size,
      variant,
      price,
      category,
      generateSkus,
    } = JSON.parse(event.body || "{}");

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." }),
      };
    }

    // 🧩 Split into main + extras
    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);
    const hasExtras = extras.length > 0;

    // 🎨 Variant handling (AI uses only first)
    const variantList = Array.isArray(allVariants)
      ? allVariants.filter(Boolean)
      : [];
    const variantLabel = variant || "Variant";

    // ⚠️ If user wants SKUs but no variants given
    if (generateSkus && variantList.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please enter at least one variant (e.g. Red, Blue, Small, Large) before generating SKUs.",
        }),
      };
    }

    // 🧠 AI Prompt – include only primary variant in natural way
    const prompt = `
You are an advanced AI trained in writing **SEO-optimized, structured, and marketplace-ready product listings** for online stores like **Jumia, Konga, Amazon, and Google Shopping**.

Your goal is to create realistic, keyword-rich, persuasive product listings that read naturally and include subtle data points useful for marketing and search.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Category: ${category || "General"}
Price: ${price || "N/A"}
${primaryVariant ? `Primary Variant Mention: ${primaryVariant}` : ""}

---

### 🧩 Writing Instructions

**Title (60–70 characters)**
${hasExtras
  ? `- Include main + extras separated by plus sign (+).
- Example: “Samsung Galaxy A16 – 128GB, 4GB RAM + Free Pen”.`
  : `- Focus on main product name and features.`}
- Maintain marketplace tone.
- Do NOT overemphasize the color/variant.

---

**Highlights (6–8 bullets)**
- 6–10 words each.
- Focus on features and benefits.
${primaryVariant ? `- Naturally include mention of "${primaryVariant}" in one bullet.` : ""}
${hasExtras ? "- Optional final bullet can mention the bonus item if applicable." : ""}

---

**Description (3 paragraphs)**
- Paragraph 1: Hook, who it’s for, value, include variant naturally (${primaryVariant || "if provided"}).
- Paragraph 2: Specs, materials, identifiers, performance, variant usage context.
- Paragraph 3: Why it’s a smart buy or gift, and extras if any.

---

**What's in the Box:**
- List all main components, extras, and (if a single variant like color) mention that variant once.
${primaryVariant ? `- Include "${primaryVariant}" naturally.` : ""}
- Avoid duplication.

Output JSON only:

{
 "title": "SEO optimized title",
 "highlights": ["H1","H2","H3","H4","H5","H6"],
 "description": "3-paragraph detailed product text",
 "whatsInTheBox": "Marketplace tone content"
}
`;

    // 🧠 AI Call
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 900,
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

    // ✅ Fallbacks
    const title =
      data.title ||
      `${mainProduct}${hasExtras ? " + " + extras.join(" + ") : ""}`;

    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : [
            "High-quality build and performance",
            ...(primaryVariant
              ? [`Available in ${primaryVariant}`]
              : []),
            ...(hasExtras ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct}${
        primaryVariant ? ` (${primaryVariant})` : ""
      } offers reliable quality and performance for online shoppers. Perfect for those seeking value and durability.${
        hasExtras
          ? ` Includes ${extras.join(" and ")} for extra convenience.`
          : ""
      }`;

    let whatsInTheBox =
      data.whatsInTheBox ||
      `1 x ${mainProduct}${primaryVariant ? ` (${primaryVariant})` : ""}${
        hasExtras ? ", " + extras.map((i) => `1 x ${i}`).join(", ") : ""
      }`;

    // 🧾 SKU generation (simple, using all variants)
    let skuData = null;
    if (generateSkus && variantList.length > 0) {
      const acronym = mainProduct
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);

      skuData = {
        skus: variantList.map((v) => ({
          variant: v,
          sku: `${acronym}-${v.toUpperCase().replace(/\s+/g, "")}`,
        })),
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
