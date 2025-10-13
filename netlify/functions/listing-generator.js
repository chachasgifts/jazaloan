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

    const prompt = `
You are an advanced AI trained in SEO copywriting for online marketplaces like Jumia, Amazon, and Google Shopping.

**Objective:** Write optimized eCommerce copy that is persuasive, keyword-rich, and product-specific, while maintaining flexibility and SEO depth.

Product details:
- Name: "${product}"
- Color: ${color || "Not specified"}
- Size: ${size || "Not specified"}
- Variant: ${variant || "Not specified"}
- Category: ${category || "General"}
- Price: ${price || "N/A"}

**Instructions:**

1️⃣ **Title (60–70 characters)**  
- Must include rich, searchable keywords relevant to the product.  
- Add distinguishing attributes naturally (color, size, variant).  
- Reflects real landing-page content.  
- Persuasive, SEO-friendly, marketplace tone (Jumia-style).  
- Example: “Men’s Cotton Polo T-Shirt – Black, Size L, Casual Wear”.

2️⃣ **Highlights (6–8 bullets)**  
- 6–10 words each.  
- Short, benefit-driven, keyword-optimized.  
- Focus on materials, benefits, value, or lifestyle fit.

3️⃣ **Description (3 paragraphs)**  
- Paragraph 1: Hook + who it’s for + core value.  
- Paragraph 2: Features, specs, materials, benefits.  
- Paragraph 3: Why it’s worth buying or gifting + marketplace relevance.  
- Include subtle mentions of attributes (price, category, availability, shipping).

4️⃣ **What's in the Box:**  
- Include *all key components* mentioned in the product name/title (e.g., “Black T-Shirt + Birthday Card”).  
- Split them naturally and describe them in a modern marketplace tone.  
- Example conversions:
   - “Black T-Shirt + Birthday Card” → “1 x Premium Black T-Shirt, 1 x Stylish Birthday Card”.
   - “Set of 2 Curtains – Blue, 250cm” → “2 x Elegant Blue Curtains (250cm)”.
- Do not simply restate the title — rephrase it professionally to sound like a retail listing.  

Output ONLY valid JSON:

{
 "title": "SEO optimized, 60–70 char product title",
 "highlights": ["H1","H2","H3","H4","H5","H6","H7","H8"],
 "description": "Three or more detailed, keyword-rich paragraphs.",
 "whatsInTheBox": "Natural marketplace-style box contents"
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 750,
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

    const title = data.title || `Optimized ${product}`;
    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : ["High quality build", "Optimized design", "Customer favorite", "Durable materials"];
    const description =
      data.description ||
      `This ${product} delivers outstanding value and performance for everyday use.`;
    const whatsInTheBox =
      data.whatsInTheBox ||
      `Includes ${product
        .split("+")
        .map((item) => item.trim())
        .map((i) => `1 x ${i}`)
        .join(", ")}.`;

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
