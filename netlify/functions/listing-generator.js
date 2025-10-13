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

    // Split the main product and extras (if any)
    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);

    // 🧠 Construct prompt for the AI
    const prompt = `
You are an expert AI trained in writing SEO-optimized, persuasive, marketplace-style product listings (for platforms like Jumia, Amazon, or Konga).

Your task is to generate a **realistic, keyword-rich** product listing in JSON format only.

Main Product: "${mainProduct}"
${extras.length > 0 ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Color: ${color || "Not specified"}
Size: ${size || "Not specified"}
Variant: ${variant || "Not specified"}
Category: ${category || "General"}
Price: ${price || "N/A"}

Follow these exact instructions:

1️⃣ **Title (60–70 characters)**  
- Include both the main product and the additional item(s), separated by a plus sign (+).  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black + Free Pen”.  
- Ensure the main product is detailed and keyword-rich, extras short and natural.  
- Marketplace tone (Jumia-style).  
- Must reflect what’s truly being sold.

2️⃣ **Highlights (6–8 bullets)**  
- 6–10 words each.  
- Focus mainly on the main product’s features and benefits.  
- Optional final bullet can mention the bonus item if applicable.

3️⃣ **Description (3 paragraphs)**  
- Paragraph 1: Hook + who it’s for + value.  
- Paragraph 2: Specs, features, materials, and benefits (main product only).  
- Paragraph 3: Why it’s a smart buy or gift + brief mention of free item or bundle bonus.  
- Keep SEO-rich, natural marketplace style.

4️⃣ **What's in the Box:**  
- Include *all key components* (main + extras).  
- Write naturally in marketplace tone.  
- Example:
   - “1 x Samsung Galaxy A16 Smartphone, 1 x Free Pen”
   - “1 x Laptop, 1 x Pair of Headphones”
- Don’t just restate the title.

Important rules:
- Do **not** invent or assume any gift, freebie, or bundle if the user didn’t mention it in the input.
- Write in clean marketplace language, no bold or Markdown formatting.
- Output **only valid JSON** in the format below.

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
      `${mainProduct}${extras.length > 0 ? " + " + extras.join(" + ") : ""}`;

    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : [
            "High-quality build and performance",
            "Optimized for everyday reliability",
            ...(extras.length > 0 ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct} offers excellent value and performance for daily use.${
        extras.length > 0
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

      const uniqueSuffix = Math.floor(Date.now() / 1000)
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
