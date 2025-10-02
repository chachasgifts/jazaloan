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

    const basePrompt = (retry = false) => `
      You are an expert in Jumia SEO product listings.
      Task: Generate an optimized listing for the product: "${product}".
      ${color ? `Color: "${color}".` : ""}

      Rules:
      - Title: 5–7 words, SEO optimized, natural, suitable for Jumia.
      - Highlights: 4–6 clear benefit-driven bullet points.
      - Description: 3–5 sentences, persuasive and detailed.

      ${retry ? "STRICT MODE: Output ONLY JSON, no extra text." : ""}
      
      Return a valid JSON object in this format ONLY:
      {
        "title": "SEO Optimized Title",
        "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
        "description": "Detailed and persuasive description"
      }
    `;

    async function generateListing(retry = false) {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: basePrompt(retry) }],
        temperature: 0.7,
        max_tokens: 400,
      });

      let content = response.choices[0].message.content.trim();

      // Try parse JSON
      try {
        return JSON.parse(content);
      } catch {
        // Try extracting JSON inside text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return null;
      }
    }

    // First attempt
    let parsed = await generateListing(false);

    // Retry if parsing failed or missing keys
    if (
      !parsed ||
      !parsed.title ||
      !parsed.highlights ||
      !parsed.description
    ) {
      parsed = await generateListing(true);
    }

    // Final safety defaults (should rarely trigger now)
    const result = {
      title: parsed?.title || "Sample Optimized Product Title",
      highlights:
        Array.isArray(parsed?.highlights) && parsed.highlights.length > 0
          ? parsed.highlights
          : ["Feature 1", "Feature 2", "Feature 3"],
      description:
        parsed?.description ||
        "This is a placeholder description. Please retry.",
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
