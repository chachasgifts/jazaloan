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

    // 🧩 Split into main + extras (if any)
    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);

    // Also detect extras by keywords like "with free", "bundle", "combo"
    const hasExtras =
      extras.length > 0 ||
      /\b(with\s+free|bundle|combo)\b/i.test(product);

    // 🧠 Build prompt dynamically
    const prompt = `
You are an expert AI trained in writing SEO-optimized, persuasive, marketplace-style product listings (for platforms like **Jumia, Konga, and Amazon**).

Your task is to generate a **realistic, keyword-rich** product listing in **valid JSON format only**.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Color: ${color || "Not specified"}
Size: ${size || "Not specified"}
Variant: ${variant || "Not specified"}
Category: ${category || "General"}
Price: ${price || "N/A"}

Follow these exact instructions:

1️⃣ **Title (60–70 characters)**  
${hasExtras
  ? `- Include both the main product and the additional item(s), separated by a plus sign (+).  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black + Free Pen”.`
  : `- Focus only on the main product (no bundle or extra).  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black”.`}
- Ensure the main product is detailed and keyword-rich, ${hasExtras ? "extras short and natural" : "natural and descriptive"}.  
- Marketplace tone (Jumia-style).  
- Must reflect what’s truly being sold.

2️⃣ **Highlights (6–8 bullets)**  
- 6–10 words each.  
- Focus mainly on the main product’s features and benefits.  
${hasExtras ? "- Optional final bullet can mention the bonus item if applicable." : ""}

3️⃣ **Description (3 paragraphs)**  
- Paragraph 1: Hook + who it’s for + value.  
- Paragraph 2: Specs, features, materials, and benefits (main product only).  
${hasExtras
  ? "- Paragraph 3: Why it’s a smart buy or gift + brief mention of free item or bundle bonus."
  : "- Paragraph 3: Why it’s a smart buy or gift — focus on the main product only."}
- Keep SEO-rich, natural marketplace style.

4️⃣ **What's in the Box:**  
- Include *all key components* (${hasExtras ? "main + extras" : "main only"}).  
- Write naturally in marketplace tone.  
${hasExtras
  ? `- Example:
   - “1 x Samsung Galaxy A16 Smartphone, 1 x Free Pen”
   - “1 x Laptop, 1 x Pair of Headphones”`
  : `- Example:
   - “1 x Samsung Galaxy A16 Smartphone”
   - “1 x Laptop”`}
- Don’t just restate the title.

🧠 Important rules:
- Do **not** invent or assume any free item, gift, or bundle if the user didn’t mention it in the input.
- Maintain natural marketplace tone (like Jumia).
- Write in plain text, no bold or Markdown.
- Output **only valid JSON** in the exact structure below:

{
 "title": "SEO optimized, 60–70 char product title",
 "highlights": ["H1","H2","H3","H4","H5","H6","H7","H8"],
 "description": "Three detailed, keyword-rich paragraphs",
 "whatsInTheBox": "Natural marketplace-style contents"
}
`;

    // 🧠 Call OpenAI
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

    // 🧾 Safe fallbacks
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
      `The ${mainProduct} offers excellent value and performance for daily use.${
        hasExtras
          ? ` It also comes with ${extras.join(
              " and "
            )}, adding extra convenience and appeal.`
          : ""
      }`;

    const whatsInTheBox =
      data.whatsInTheBox ||
      productParts.map((i) => `1 x ${i}`).join(", ");

    // 🧮 Optional SKU generation with unique IDs
    let skuData = null;
    if (generateSkus) {
      const acronym = mainProduct
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);

      const uniqueSuffix =
        Math.floor(Date.now() / 1000)
          .toString(36)
          .slice(-3)
          .toUpperCase() + Math.floor(Math.random() * 90 + 10);

      const colorCode = color
        ? `-${color.split(" ")[0].substring(0, 2).toUpperCase()}`
        : "";

      const sizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

      skuData = {
        format: `${acronym}${colorCode}-[Size]-${uniqueSuffix}`,
        skus: sizes.map((sz) => ({
          size: sz,
          sku: `${acronym}${colorCode}-${sz}-${uniqueSuffix}`,
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
