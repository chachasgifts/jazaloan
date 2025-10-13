// /api/generateProductCopy.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const { product, color, size, variant, price, category } = JSON.parse(event.body || "{}");

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." }),
      };
    }

    // Split product like "Samsung Galaxy A16 + Free Pen"
    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);

    const prompt = `
You are an expert SEO marketplace copywriter (Jumia, Amazon, Google Shopping).

**Objective:** Write a persuasive, keyword-rich product listing with bolded key terms for better readability and SEO.

Main Product: "${mainProduct}"
Extra/Bundled Items: ${extras.length > 0 ? extras.join(", ") : "None"}
Color: ${color || "Not specified"}
Size: ${size || "Not specified"}
Variant: ${variant || "Not specified"}
Category: ${category || "General"}
Price: ${price || "N/A"}

**Instructions:**

1️⃣ **Title (60–70 characters)**  
- Include main + extras separated by “+”.  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black + Free Pen”.

2️⃣ **Highlights (6–8 bullets)**  
- 6–10 words, benefit-driven, keyword-optimized.

3️⃣ **Description (3 paragraphs)**  
- Use **bold** markdown for important/SEO words (materials, size, brand, color, features, benefits).  
- Paragraph 1: Hook + target customer + main benefit.  
- Paragraph 2: Features, specs, materials, benefits.  
- Paragraph 3: Mention gift/extras as bonus value (e.g., “Includes a **Free Pen**”).  
- Maintain persuasive, marketplace tone.

4️⃣ **What's in the Box:**  
- Include *all key components* (main + extras).  
- Natural retail tone.  
- Example: “1 x Samsung Galaxy A16 Smartphone, 1 x Free Pen”.

Output ONLY valid JSON:

{
 "title": "SEO optimized, 60–70 char product title",
 "highlights": ["H1","H2","H3","H4","H5","H6","H7","H8"],
 "description": "Three+ detailed, markdown-bolded paragraphs including the gift mention.",
 "whatsInTheBox": "Natural marketplace-style contents"
}
`;

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

    const title =
      data.title ||
      `${mainProduct}${extras.length > 0 ? " + " + extras.join(" + ") : ""}`;

    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : [
            "High-quality performance",
            "Optimized design",
            "Durable materials",
            ...(extras.length > 0 ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The **${mainProduct}** offers exceptional **performance** and **value** for everyday use.${
        extras.length > 0
          ? ` As a special bonus, this bundle includes **${extras.join(
              " and "
            )}**, adding extra convenience and appeal.`
          : ""
      }`;

    const whatsInTheBox =
      data.whatsInTheBox ||
      productParts.map((i) => `1 x ${i}`).join(", ");

    return {
      statusCode: 200,
      body: JSON.stringify({
        title,
        highlights,
        description,
        whatsInTheBox,
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
