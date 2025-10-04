import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event, context) {
  try {
    const { product, color } = JSON.parse(event.body || "{}");

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." }),
      };
    }

    const prompt = `
    You are an expert e-commerce copywriter specializing in Jumia and Amazon SEO listings.

    Product: "${product}" ${color ? `Color: ${color}` : ""}

    Write a Jumia product listing that is persuasive, SEO-optimized, and designed to convert sales.

    Rules:
    - Title: 5–7 words, must be persuasive, clear, and keyword-rich (Jumia-approved style).
    - Highlights: 4–6 short benefit-driven bullets (not just features).
    - Description: At least 3 detailed, marketing-style paragraphs. 
      - Paragraph 1: Hook + emotional appeal + who it's for.
      - Paragraph 2: Features, material, benefits, everyday usage.
      - Paragraph 3: Why it’s a great purchase or gift idea.
    - What's in the Box: If the product title clearly states a quantity (like "2-Pack", "Set of 3"), use that same quantity. If not, assume "1 x [title]".

    ⚠️ Output ONLY valid JSON in this format:
    {
      "title": "SEO Optimized Title (5-7 words)",
      "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
      "description": "Three or more paragraphs of detailed copy",
      "whatsInTheBox": "Box content string"
    }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 700,
    });

    const content = response.choices[0].message.content.trim();
    console.log("🔹 RAW AI OUTPUT:", content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (!parsed) {
      console.log("⚠️ Could not parse JSON, sending fallback.");
    }

    // ✅ Safe defaults
    let title = parsed?.title || `SEO Optimized ${product}`;
    let whatsInTheBox = parsed?.whatsInTheBox;

    // Auto-generate "What's in the Box" if missing
    if (!whatsInTheBox) {
      if (/(\d+|pack|set)/i.test(title)) {
        // if title already contains quantity info like "2 Pack", "Set of 3"
        whatsInTheBox = title;
      } else {
        whatsInTheBox = `1 x ${title}`;
      }
    }

    const result = {
      title,
      highlights:
        Array.isArray(parsed?.highlights) && parsed.highlights.length > 0
          ? parsed.highlights
          : ["Durable design", "Premium quality", "Perfect for daily use"],
      description:
        parsed?.description ||
        "This product combines quality, style, and value—designed to meet your needs in everyday life.",
      whatsInTheBox,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("❌ FUNCTION ERROR:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
