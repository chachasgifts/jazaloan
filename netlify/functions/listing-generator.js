import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const {
      product,
      color: primaryVariant, // ✅ from description (frontend fix ensures this)
      allVariants = [],
      size,
      variant,
      price,
      category,
      generateSkus,
    } = JSON.parse(event.body || "{}");

    if (!product) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product name is required." }),
      };
    }

    const productParts = product.split("+").map(p => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);
    const hasExtras = extras.length > 0;

    const variantList = Array.isArray(allVariants)
      ? allVariants.filter(Boolean)
      : [];
    const variantLabelInput = variant || "Variant";

    const fullVariantSet = new Set([
      ...(primaryVariant ? [primaryVariant] : []),
      ...variantList,
    ]);
    const finalVariants = Array.from(fullVariantSet);

    if (generateSkus && finalVariants.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please enter at least one variant (e.g. Red, Blue, Small, Large) before generating SKUs.",
        }),
      };
    }

    // 🧠 Stronger AI instruction enforcement
    let variantNote = "";
    if (primaryVariant) {
      variantNote = `Use only the color "${primaryVariant}" for all parts of the listing.
Do not mention any other colors, sizes, or the word "variants" anywhere.`;
    } else {
      variantNote = `Write a neutral listing with no color or variant references.`;
    }

    const prompt = `
You are an expert copywriter for **SEO-optimized, marketplace-ready product listings** (e.g. Jumia, Konga, Amazon).  
Generate persuasive and natural product listings with human-quality tone.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Category: ${category || "General"}
Price: ${price || "N/A"}
${primaryVariant ? `Primary Color: ${primaryVariant}` : "No primary color detected"}

---

### 🧩 Writing Instructions

**1️⃣ Title (60–70 characters)**
- Focus on main product name.
${primaryVariant ? `- Mention the color "${primaryVariant}" naturally.` : "- Do not mention color or variant."}

**2️⃣ Highlights (6–8 bullets)**
- Showcase benefits and materials.
${primaryVariant ? `- Include one bullet mentioning "${primaryVariant}" naturally.` : "- Exclude color references."}
${hasExtras ? "- Include a bullet for extras." : ""}

**3️⃣ Description (3 natural paragraphs)**
- Write engaging and SEO-rich copy.
${primaryVariant ? `- Mention "${primaryVariant}" only once naturally in the first paragraph.` : "- Avoid color mentions."}
${variantNote}

**4️⃣ What's in the Box**
- List the included items clearly and naturally.
${primaryVariant ? `- Mention "${primaryVariant}" once if appropriate.` : "- No color mentions."}

Output strictly as valid JSON:

{
 "title": "SEO optimized title",
 "highlights": ["H1","H2","H3","H4","H5","H6"],
 "description": "3 paragraphs",
 "whatsInTheBox": "Box contents"
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 900,
      messages: [
        { role: "system", content: "You are a JSON-only assistant that outputs structured data optimized for eCommerce listings." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");

    const title =
      data.title ||
      (primaryVariant
        ? `${mainProduct} (${primaryVariant})`
        : mainProduct);

    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : [
            "High-quality build and reliable performance",
            ...(primaryVariant ? [`Elegant ${primaryVariant} design`] : []),
            ...(hasExtras ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct}${primaryVariant ? ` in ${primaryVariant}` : ""} offers great value and reliable performance for shoppers. Perfect for ${category || "any"} category.${hasExtras ? ` Includes ${extras.join(" and ")}.` : ""}`;

    let whatsInTheBox =
      data.whatsInTheBox ||
      `1 x ${mainProduct}${primaryVariant ? ` (${primaryVariant})` : ""}${hasExtras ? ", " + extras.map(i => `1 x ${i}`).join(", ") : ""}`;

    whatsInTheBox = whatsInTheBox.replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();

    // 🧾 SKU generation
    let skuData = null;
    if (generateSkus && finalVariants.length > 0) {
      const acronym = mainProduct
        .split(" ")
        .map(w => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);

      const colors = [
        "black","white","red","blue","green","yellow","pink","purple","grey","gray","brown",
        "gold","silver","navy","cream","orange","teal","maroon","beige","turquoise"
      ];
      const sizes = [
        "xs","s","m","l","xl","xxl","small","medium","large","extra large",
        "32","34","36","38","40","42","44","46"
      ];
      const materials = [
        "cotton","silk","leather","matte","glossy","wool","denim","linen","polyester","plastic","metal"
      ];

      let detectedLabel = "Variant";
      const lowerVariants = finalVariants.map(v => v.toLowerCase());

      if (lowerVariants.some(v => colors.includes(v))) detectedLabel = "Color";
      else if (lowerVariants.some(v => sizes.includes(v))) detectedLabel = "Size";
      else if (lowerVariants.some(v => materials.includes(v))) detectedLabel = "Type";

      skuData = {
        label: detectedLabel,
        skus: finalVariants.map(v => ({
          [detectedLabel.toLowerCase()]: v,
          sku: `${acronym}-${v.toUpperCase().replace(/\s+/g, "")}`,
        })),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        title,
        highlights,
        description,
        whatsInTheBox,
        skus: skuData,
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
