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

    // 🪄 Progress steps for frontend animation
    const progressSteps = [
      "🔍 Collecting product insights...",
      "📊 Analyzing best SEO keywords...",
      "✍️ Writing persuasive Jumia title...",
      "✨ Crafting benefit-driven highlights...",
      "📝 Finalizing engaging product description..."
    ];

    // 🎯 Refined, rule-based prompt
    const prompt = `
You are an expert e-commerce copywriter specializing in **Jumia** product listings.

Product: "${product}" ${color ? `(Color: ${color})` : ""}

Follow these exact rules:

- **Title:** 5–7 words, must be persuasive, clear, and keyword-rich (Jumia-approved style).
- **Highlights:** 4–6 short, benefit-driven bullet points (avoid listing only features).
- **Description:** At least 3 detailed, marketing-style paragraphs:
   - Paragraph 1: Hook + emotional appeal + who it's for.
   - Paragraph 2: Features, materials, benefits, and everyday usage.
   - Paragraph 3: Why it’s a smart purchase or great gift idea.
- **What's in the Box:** If the product title includes a quantity (e.g., “2-Pack”, “Set of 3”), use that same quantity. Otherwise, default to “1 x [title]”.

Return **only valid JSON** in this format (no explanations, no extra text):

{
  "title": "SEO-optimized Jumia-style title",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4"],
  "description": "Three+ persuasive paragraphs of marketing copy",
  "whatsInTheBox": "Box content string"
}
`;

    // ⚡ Ultra-fast GPT-4o-mini for speed and cost efficiency
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 650,
      messages: [
        {
          role: "system",
          content:
            "You are a precise JSON-only assistant that outputs valid JSON following user instructions exactly.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");

    // ✅ Safe fallbacks
    const title = data.title || `Optimized ${product}`;
    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : ["Durable design", "Premium quality", "Perfect for daily use"];
    const description =
      data.description ||
      `This ${product} combines quality, performance, and modern design to meet your everyday needs.`;
    const whatsInTheBox =
      data.whatsInTheBox ||
      (/(\d+|pack|set)/i.test(title) ? title : `1 x ${title}`);

    // 🚀 Return final result with progress steps
    return {
      statusCode: 200,
      body: JSON.stringify({
        progressSteps,
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
