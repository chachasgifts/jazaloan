import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event, context) {
  try {
    const { product, color } = JSON.parse(event.body);

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." }),
      };
    }

    const prompt = `
      Return ONLY valid JSON in this exact format (no text before or after, no explanations):

      {
        "title": "SEO Optimized Title (5-7 words)",
        "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
        "description": "Detailed persuasive description here."
      }

      Product: "${product}" ${color ? ` Color: ${color}` : ""}
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    let content = response.choices[0].message.content.trim();

    // 🔹 Log what AI actually said
    console.log("🔹 RAW AI OUTPUT:", content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    if (!parsed) {
      console.log("⚠️ Could not parse JSON, sending fallback.");
    }

    const result = {
      title: parsed?.title || "Fallback Title",
      highlights: Array.isArray(parsed?.highlights) ? parsed.highlights : ["Fallback 1"],
      description: parsed?.description || "Fallback description.",
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
