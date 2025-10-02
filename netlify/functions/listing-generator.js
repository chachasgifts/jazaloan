import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // from Netlify env
});

export async function handler(event, context) {
  try {
    const { product, color } = JSON.parse(event.body || "{}");

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required" }),
      };
    }

    const prompt = `
      You are an expert in Jumia SEO product listings.
      Generate a JSON object with 3 fields: title, highlights, description.
      
      Product: "${product}"
      Color: "${color || "Not specified"}"
      
      Requirements:
      - Title: concise, optimized for SEO, include product + color.
      - Highlights: 4-6 bullet points, each under 12 words, very benefit-driven.
      - Description: professional, engaging, 2-3 paragraphs suitable for Jumia listing.
      
      Return ONLY valid JSON, no extra text.
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    // Try parsing the model response into JSON
    let result;
    try {
      result = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to parse AI response" }),
      };
    }

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
