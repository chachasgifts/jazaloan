// /api/generateProductCopy.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const {
      product,
      color: variantInput,
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

    // 🧩 Split into main + extras (if any)
    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);
    const hasExtras = extras.length > 0;

    // 🎨 Variant handling
    let effectiveVariant = variantInput || "";
    const variantList = variantInput
      ? variantInput
          .split(/[,\s]+/)
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    // ⚠️ Error if user clicked “Generate SKUs” but didn’t specify variants
    if (generateSkus && variantList.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please enter at least one variant (e.g. Red, Blue, Small, Large) before generating SKUs.",
        }),
      };
    }

    // 🧠 Build AI prompt (variants excluded from main text)
    const prompt = `
You are an advanced AI trained in writing **SEO-optimized, structured, and marketplace-ready product listings** for online stores like **Jumia, Konga, Amazon, and Google Shopping**.

Your goal is to create realistic, keyword-rich, persuasive product listings that read naturally and include subtle data points useful for marketing and search.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Category: ${category || "General"}
Price: ${price || "N/A"}

---

### 🧩 Detailed Writing Instructions

1️⃣ **Title (60–70 characters)**
${hasExtras
  ? `- Include both the main product and the additional item(s), separated by a plus sign (+).
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM + Free Pen”.`
  : `- Focus only on the main product (no extras or variant colors/sizes).
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM”.`}
- Do NOT mention color, size, or other variants in the title.
- Maintain natural Jumia-style marketplace tone.
- Must reflect what’s truly being sold.

---

2️⃣ **Highlights (6–8 bullets)**
- 6–10 words each.
- Focus mainly on the main product’s **features and benefits**.
- Do NOT mention colors, sizes, or variants.
${hasExtras ? "- Optional final bullet can mention the bonus item if applicable." : ""}

---

3️⃣ **Description (3 structured paragraphs)**
Each paragraph should be natural, SEO-rich, and complete.

- **Paragraph 1 – Overview / Value Hook**
  Describe what the product is, who it’s for, and what makes it stand out.
  Naturally mention value for money (without numbers).

- **Paragraph 2 – Product Data & Benefits**
  Include *basic specs, materials, and performance details*.
  Mention *product identifiers* like model name or type if applicable.
  Provide context in its category (e.g. electronics, apparel, etc.).
  Do NOT mention variant or color.

- **Paragraph 3 – Smart Buy Justification & Distribution Readiness**
  Explain why it’s a smart choice or thoughtful gift.
  Mention reliability, ease of use, delivery readiness, and online marketplace suitability.
  Mention extras only if applicable.

Ensure smooth transitions, professional tone, and no repeated lines.

---

4️⃣ **What's in the Box:**
- Include *main product (and extras if any)*.
- Write naturally in marketplace tone.
- Do NOT include any variant, color, or size term.

Example:
   - “1 x Samsung Galaxy A16 Smartphone, 1 x Free Pen”
   - “1 x Laptop, 1 x Pair of Headphones”

---

🧠 **Important Rules**
- Do **not** invent or assume free items or bundles.
- Do **not** include color, size, or other variants in title, highlights, or box content.
- Maintain clean, professional, marketplace tone.
- Output **valid JSON only**, with this structure:

{
 "title": "SEO optimized, 60–70 char product title",
 "highlights": ["H1","H2","H3","H4","H5","H6","H7","H8"],
 "description": "Three detailed, keyword-rich paragraphs",
 "whatsInTheBox": "Natural marketplace-style contents"
}
`;

    // 🧠 Send to OpenAI
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

    // ✅ Safe fallbacks
    const title =
      data.title ||
      `${mainProduct}${hasExtras ? " + " + extras.join(" + ") : ""}`;

    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : [
            "High-quality build and performance",
            "Optimized for everyday reliability",
            ...(hasExtras ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct} offers excellent value and reliability for online shoppers. Designed for modern needs, it fits well into the ${category} category and ensures top performance.${
        hasExtras
          ? ` It also includes ${extras.join(
              " and "
            )}, adding convenience for those who appreciate extra value.`
          : ""
      }`;

    let whatsInTheBox =
      data.whatsInTheBox ||
      productParts.map((i) => `1 x ${i}`).join(", ");

    // 🧹 Clean “what’s in the box” of color or size mentions
    const colorWords = [
      "black", "white", "blue", "red", "green", "yellow", "pink", "purple",
      "grey", "gray", "brown", "beige", "gold", "silver", "navy", "cream",
      "orange", "maroon", "teal", "turquoise"
    ];
    const variantPattern = new RegExp(`\\b(${colorWords.join("|")})\\b`, "gi");
    whatsInTheBox = whatsInTheBox.replace(variantPattern, "").replace(/\s{2,}/g, " ").trim();
    whatsInTheBox = whatsInTheBox.replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim();

    // 🧾 SKU generation (flexible, variant-only)
    let skuData = null;
    const variantLabel = variant || "Variant";

    if (generateSkus && variantList.length > 0) {
      const acronym = mainProduct
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);

      skuData = {
        label: variantLabel,
        format: `${acronym}-[${variantLabel}]`,
        skus: variantList.map((v) => ({
          [variantLabel.toLowerCase()]: v,
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
