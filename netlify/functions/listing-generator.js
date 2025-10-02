import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // stored in Netlify
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
      You are an expert in Jumia SEO product listings.
      Create a professional product listing for: "${product}".
      If a color was provided, include it in the highlights and description: "${color}".
      
      Rules:
      - Title must be 5–7 words, SEO optimized, natural and engaging.
      - Highlights: 4–6 bullet points, clear and benefit-focused.
      - Description: a well-structured, detailed paragraph (3–5 sentences).
      
      Return a valid JSON object with keys:
      {
        "title": "...",
        "highlights": ["...", "...", "..."],
        "description": "..."
      }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    });

    let content = response.choices[0].message.content.trim();

    // Try parsing JSON safely
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If AI returns text instead of JSON, try regex cleanup
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    }

    // Ensure required fields exist with defaults
    const result = {
      title: parsed.title || "Sample SEO Optimized Product Title",
      highlights: Array.isArray(parsed.highlights) && parsed.highlights.length > 0 
        ? parsed.highlights 
        : ["Feature 1", "Feature 2", "Feature 3"],
      description: parsed.description || "This is a sample description for the product.",
    };

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
