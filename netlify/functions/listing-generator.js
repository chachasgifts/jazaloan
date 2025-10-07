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
You are an expert eCommerce copywriter for Jumia and Amazon listings.

Write a Jumia product listing for:
Product: "${product}" ${color ? `(Color: ${color})` : ""}

Follow these exact rules:
- Title: 5–7 words, persuasive, keyword-rich.
- Highlights: 4–6 short bullet points (benefit-based).
- Description: 3 paragraphs (hook, features, why buy).
- What's in the Box: mention 1 unit unless title has quantity info.

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "highlights": ["string"],
  "description": "string",
  "whatsInTheBox": "string"
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant that returns only valid JSON. Never include commentary or explanations." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 700,
      response_format: { type: "json_object" }, // ✅ Forces pure JSON
    });

    const data = response.choices[0].message.content
      ? JSON.parse(response.choices[0].message.content)
      : {};

    // ✅ Safe fallback
    const title = data.title || `Optimized ${product}`;
    const highlights = Array.isArray(data.highlights) && data.highlights.length
      ? data.highlights
      : ["Durable design", "Premium quality", "Perfect for daily use"];
    const description =
      data.description ||
      `This ${product} is designed for quality, performance, and everyday value.`;
    const whatsInTheBox = data.whatsInTheBox || `1 x ${title}`;

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
