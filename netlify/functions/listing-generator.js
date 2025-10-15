// /api/generateProductCopy.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const { product, color: variantInput, size, variant, price, category, generateSkus } =
      JSON.parse(event.body || "{}");

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

    // 🎨 Smart variant handling (flexible for colors, sizes, or styles)
    let effectiveVariant = variantInput || "Not specified";

    // If multiple variants are provided (e.g. "Red, Blue, Large"), normalize them
    const variantList = variantInput
      ? variantInput
          .split(/[,\s]+/)
          .map((v) => v.trim())
          .filter(Boolean)
      : [];

    // ⚠️ Error if user clicked “Generate SKUs” but did not specify any variant
    if (generateSkus && variantList.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please enter at least one variant (e.g. Red, Blue, Small, Large) before generating SKUs.",
        }),
      };
    }

    // 🧠 Build AI prompt
    const prompt = `
You are an advanced AI trained in writing **SEO-optimized, structured, and marketplace-ready product listings** for online stores like **Jumia, Konga, Amazon, and Google Shopping**.

Your goal is to create realistic, keyword-rich, persuasive product listings that read naturally and include subtle data points useful for marketing and search.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Variants (color, size, or other): ${effectiveVariant}
Size: ${size || "Not specified"}
Variant Type: ${variant || "Not specified"}
Category: ${category || "General"}
Price: ${price || "N/A"}

---

### 🧩 Detailed Writing Instructions

1️⃣ **Title (60–70 characters)**  
${hasExtras
  ? `- Include both the main product and the additional item(s), separated by a plus sign (+).  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black + Free Pen”.`
  : `- Focus only on the main product (no extras).  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black”.`}
- Ensure the main product is detailed and keyword-rich.  
- Maintain natural Jumia-style marketplace tone.  
- Must reflect what’s truly being sold.

---

2️⃣ **Highlights (6–8 bullets)**  
- 6–10 words each.  
- Focus mainly on the main product’s **features and benefits**.  
${hasExtras ? "- Optional final bullet can mention the bonus item if applicable." : ""}

---

3️⃣ **Description (3 structured paragraphs)**  
Each paragraph should feel natural, SEO-rich, and complete.  
Include the following layers of marketplace-relevant information:

- **Paragraph 1 – Overview / Value Hook**  
  Describe what the product is, who it’s for, and what makes it stand out.  
  Naturally mention price range, affordability, or value for money (without numbers).  

- **Paragraph 2 – Product Data & Benefits**  
  Include *basic product data* (type, specs, materials, performance).  
  Mention *product identifiers* like model name or type when applicable.  
  Include *product category* context (e.g., electronics, apparel, etc.).  
  Talk about *availability* and *marketplace suitability* (e.g., ideal for Jumia or online shoppers).  
  Reflect the following variant(s): "${effectiveVariant}".

- **Paragraph 3 – Smart Buy Justification & Distribution Readiness**  
  Explain why it’s a smart choice or thoughtful gift.  
  If applicable, mention *bundled extras* or *added convenience*.  
  Reference readiness for *shopping campaigns*, *marketplaces*, or *fast shipping*.  
  Mention trust, delivery speed, or ease of ordering in a subtle way.  

Ensure smooth transitions, professional tone, and no repeated lines.

---

4️⃣ **What's in the Box:**  
- Include *all key components* (${hasExtras ? "main + extras" : "main only"}).  
- Write naturally in marketplace tone.  
- Example:
   - “1 x Samsung Galaxy A16 Smartphone, 1 x Free Pen”  
   - “1 x Laptop, 1 x Pair of Headphones”  
- Do not restate the title.

---

🧠 **Important Rules**
- Do **not** invent or assume any free item, gift, or bundle if the user didn’t type it.
- Maintain clean, professional, marketplace language.
- Write in plain text only (no bold, Markdown, or emojis).
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

    // 🧹 Clean up variant terms from "What's in the Box" if no variants were specified
    if (variantList.length === 0) {
      const colorWords = [
        "black", "white", "blue", "red", "green", "yellow", "pink", "purple",
        "grey", "gray", "brown", "beige", "gold", "silver", "navy", "cream",
        "orange", "maroon", "teal", "turquoise"
      ];
      const variantPattern = new RegExp(`\\b(${colorWords.join("|")})\\b`, "gi");
      whatsInTheBox = whatsInTheBox.replace(variantPattern, "").replace(/\s{2,}/g, " ").trim();
      whatsInTheBox = whatsInTheBox.replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim();
    }

    // 🧾 SKU generation logic (variant-based)
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
        format: `${acronym}-[Variant]`,
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
