const fetch = require("node-fetch");

exports.handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);

    const { productName, category, color, colorFamily, features } = body;

    if (!productName || !category || !color || !colorFamily) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // ✅ Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a product listing generator for Jumia. Follow Jumia's SEO-friendly rules strictly.",
          },
          {
            role: "user",
            content: `
Generate a Jumia product listing.

Rules:
- Title must be 15–70 characters, no brand name, must include product type and color.
- Description around 100 words, optimized for SEO.
- Highlights: key features, benefits, and how it works (bullet points).
- SKU: generate a unique random alphanumeric code.
- Sizes: Small, Medium, Large, XL, XXL, 3XL.
- What's in the box: describe what the buyer receives.

Input:
Product: ${productName}
Category: ${category}
Color: ${color}
Color Family: ${colorFamily}
Extra Features: ${features || "N/A"}
          `,
          },
        ],
        max_tokens: 400,
      }),
    });

    const data = await response.json();

    // Extract model reply safely
    const reply = data?.choices?.[0]?.message?.content || "";

    // Parse into sections (very basic split)
    const output = {
      title: reply.match(/Title:(.*)/i)?.[1]?.trim() || "",
      description: reply.match(/Description:(.*)/is)?.[1]?.trim() || "",
      highlights: reply.match(/Highlights:(.*?)(Description|SKU|Sizes|What's in the box)/is)
        ? reply.match(/Highlights:(.*?)(Description|SKU|Sizes|What's in the box)/is)[1]
            .split(/\n|•|-/)
            .map(s => s.trim())
            .filter(Boolean)
        : [],
      sku: reply.match(/SKU:(.*)/i)?.[1]?.trim() || `SKU-${Date.now()}`,
      box: reply.match(/box:(.*)/i)?.[1]?.trim() || "1 x " + productName,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(output),
    };

  } catch (err) {
    console.error("❌ Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error: " + err.message }),
    };
  }
};
