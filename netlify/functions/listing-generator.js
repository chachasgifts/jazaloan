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
You are an advanced AI trained in SEO copywriting for online marketplaces (Jumia, Amazon, Google Shopping).

**Goal:** Write persuasive, keyword-rich, SEO-optimized product listings that reflect real marketplace style and include any promotional or bundled gifts.

Main Product: "${mainProduct}"
Extra/Bundled Items: ${extras.length > 0 ? extras.join(", ") : "None"}
Color: ${color || "Not specified"}
Size: ${size || "Not specified"}
Variant: ${variant || "Not specified"}
Category: ${category || "General"}
Price: ${price || "N/A"}

**Instructions:**

1️⃣ **Title (60–70 characters)**  
- Include the main product + extras, separated by a plus (+).  
- Be keyword-rich, persuasive, and marketplace-optimized (Jumia-style).  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black + Free Pen”.

2️⃣ **Highlights (6–8 bullets)**  
- 6–10 words each.  
- Focus on benefits, features, and lifestyle fit.  
- Include one line about the free/bundled item (e.g., “Comes with a Free Pen”).

3️⃣ **Description (3 paragraphs)**  
- **Paragraph 1:** Hook + who it’s for + why it’s great.  
- **Paragraph 2:** Detailed specs, materials, and benefits (main product).  
- **Paragraph 3:** Mention the offer/gift naturally — explain that it’s an added value, bonus, or promotional item.  
- Maintain SEO tone, use trending product keywords relevant to this product type.

4️⃣ **What's in the Box:**  
- List *all components* (main + extras).  
- Example:
   - “1 x Samsung Galaxy A16 Smartphone, 1 x Free Pen”
   - “1 x Laptop, 1 x Pair of Headphones”
- Natural, retail-style tone.

Output ONLY valid JSON:

{
 "title": "SEO optimized, 60–70 char product title",
 "highlights": ["H1","H2","H3","H4","H5","H6","H7","H8"],
 "description": "Three+ detailed, keyword-rich paragraphs including the gift mention.",
 "whatsInTheBox": "Natural marketplace-style contents"
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
        : [
            "High-quality performance",
            "Optimized for everyday use",
            "Durable materials",
            ...(extras.length > 0 ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct} delivers outstanding performance and value for daily use.${
        extras.length > 0
          ? ` As a special bonus, it comes with ${extras.join(" and ")} — a thoughtful addition for added convenience.`
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
