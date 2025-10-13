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

    // Split product parts like: "Samsung Galaxy A16 + Free Pen"
    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const bundleItems = productParts.slice(1);

    const prompt = `
You are an advanced AI trained in SEO copywriting for online marketplaces like Jumia, Amazon, and Google Shopping.

**Objective:** Write optimized eCommerce copy that is persuasive, keyword-rich, and marketplace-accurate.

Main Product: "${mainProduct}"
Additional Items (bundled/extras): ${bundleItems.length > 0 ? bundleItems.join(", ") : "None"}
Color: ${color || "Not specified"}
Size: ${size || "Not specified"}
Variant: ${variant || "Not specified"}
Category: ${category || "General"}
Price: ${price || "N/A"}

**Instructions:**

1️⃣ **Title (60–70 characters)**  
- Include both the main product and the additional item(s), separated by a plus sign (+).  
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM, Black + Free Pen”.  
- Ensure the main product is detailed and keyword-rich, extras short and natural.  
- Marketplace tone (Jumia-style).  
- Must reflect what’s truly being sold.

2️⃣ **Highlights (6–8 bullets)**  
- 6–10 words each.  
- Focus mainly on the main product’s features and benefits.  
- Optional final bullet can mention the bonus item.

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

Output ONLY valid JSON:

{
 "title": "SEO optimized 60–70 char title (include + extras)",
 "highlights": ["H1","H2","H3","H4","H5","H6","H7","H8"],
 "description": "Three+ marketing paragraphs (main product focus, extras optional)",
 "whatsInTheBox": "Marketplace-style contents"
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 800,
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

    const title = data.title || `${mainProduct}${bundleItems.length > 0 ? " + " + bundleItems.join(" + ") : ""}`;
    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : ["High-quality build", "Optimized design", "Customer favorite", "Durable materials"];
    const description =
      data.description ||
      `The ${mainProduct} delivers outstanding value and performance for everyday use.`;
    const whatsInTheBox =
      data.whatsInTheBox ||
      `Includes ${productParts.map((i) => `1 x ${i}`).join(", ")}.`;

    return {
      statusCode: 200,
      body: JSON.stringify({ title, highlights, description, whatsInTheBox }),
    };
  } catch (error) {
    console.error("❌ FUNCTION ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
