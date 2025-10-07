import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const { product, color } = JSON.parse(event.body || "{}");

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." }),
      };
    }

    const prompt = `
You are an expert Jumia copywriter.

Product: "${product}" ${color ? `(Color: ${color})` : ""}

Follow these exact rules:
- Title: 5–7 words, persuasive, keyword-rich, Jumia-style.
- Highlights: 4–6 short, benefit-driven bullets.
- Description: 3 paragraphs —
   1️⃣ Hook + who it’s for
   2️⃣ Features, materials, benefits
   3️⃣ Why it’s a great purchase/gift
- What's in the Box: Use quantity from title if present, otherwise "1 x [title]".

Output only valid JSON:

{
 "title": "SEO optimized Jumia title",
 "highlights": ["H1","H2","H3","H4"],
 "description": "Three+ marketing paragraphs",
 "whatsInTheBox": "Box content"
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0, // 🔥 more creative, avoids repeated titles
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only assistant that outputs valid structured data for e-commerce listings.",
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
        : ["Durable design", "High quality", "Perfect for everyday use"];
    const description =
      data.description ||
      `This ${product} blends quality, comfort, and value for everyday use.`;
    const whatsInTheBox =
      data.whatsInTheBox ||
      (/(\d+|pack|set)/i.test(title) ? title : `1 x ${title}`);

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
