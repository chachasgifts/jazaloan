import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // stored in Netlify Environment Variables
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
      You are an expert in Jumia SEO product listings.
      Task: Generate an optimized listing for the product: "${product}".
      ${color ? `Color: "${color}".` : ""}

      Rules:
      - Title: 5–7 words, SEO optimized, natural, suitable for Jumia.
      - Highlights: 4–6 clear benefit-driven bullet points.
      - Description: 3–5 sentences, persuasive and detailed.

      ⚠️ Output ONLY valid JSON (no extra text). 
      JSON format:
      {
        "title": "SEO Optimized Title",
        "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
        "description": "Detailed persuasive description"
      }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = response.choices[0].message.content.trim();

    // 🔹 Log raw AI output to Netlify logs
    console.log("🔹 RAW AI OUTPUT:", content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON block if wrapped in text
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    if (!parsed) {
      console.log("⚠️ Could not parse JSON, sending fallback.");
    }

    const result = {
      title: parsed?.title || "Fallback SEO Product Title",
      highlights:
        Array.isArray(parsed?.highlights) && parsed.highlights.length > 0
          ? parsed.highlights
          : ["Fallback Feature 1", "Fallback Feature 2", "Fallback Feature 3"],
      description:
        parsed?.description ||
        "Fallback description. Please try again with another product name.",
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
