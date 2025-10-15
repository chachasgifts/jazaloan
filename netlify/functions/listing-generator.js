import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const {
      product,
      color: primaryVariant, // color or type entered in description input
      allVariants = [], // all variants entered by user (for SKU use)
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

    // 🧩 Split main and extras
    const productParts = product.split("+").map((p) => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);
    const hasExtras = extras.length > 0;

    // 🎨 Variant handling
    const variantList = Array.isArray(allVariants)
      ? allVariants.filter(Boolean)
      : [];
    const variantLabelInput = variant || "Variant";

    // ✅ Combine description color + variants (deduped)
    const fullVariantSet = new Set([
      ...(primaryVariant ? [primaryVariant] : []),
      ...variantList,
    ]);
    const finalVariants = Array.from(fullVariantSet);

    // ⚠️ Only warn if SKUs requested but no variants at all
    if (generateSkus && finalVariants.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please enter at least one variant (e.g. Red, Blue, Small, Large) before generating SKUs.",
        }),
      };
    }

    // 🧠 AI Prompt setup based on color presence
    let variantNote = "";
    if (primaryVariant && variantList.length === 0) {
      variantNote = `Include the color "${primaryVariant}" naturally throughout the listing (not in every line).`;
    } else if (primaryVariant && variantList.length > 0) {
      variantNote = `Mention only the color "${primaryVariant}" naturally in the text. Ignore other variants for the content.`;
    } else {
      variantNote = `Do not mention any colors or variants. Write a fully neutral listing.`;
    }

    // 🧠 Construct the AI prompt
    const prompt = `
You are an advanced AI trained in writing **SEO-optimized, structured, and marketplace-ready product listings** for online stores like **Jumia, Konga, and Amazon**.

Your job: Write persuasive, keyword-rich product listings that sound natural and marketplace-appropriate.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Category: ${category || "General"}
Price: ${price || "N/A"}
${primaryVariant ? `Primary Variant (from user): ${primaryVariant}` : "No color or variant provided"}

---

### 🧩 Writing Instructions

**1️⃣ Title (60–70 characters)**
${hasExtras
  ? `- Include main + extras separated by plus sign (+).`
  : `- Focus only on the main product name and features.`}
- Maintain clean, professional marketplace tone.
- ${primaryVariant ? `Include the color "${primaryVariant}" subtly.` : "Do NOT include color or variant mentions."}

---

**2️⃣ Highlights (6–8 bullets)**
- Focus on benefits, specs, and performance.
- Avoid listing variants.
${primaryVariant ? `- Include one bullet that mentions "${primaryVariant}" naturally.` : ""}
${hasExtras ? "- Add one bullet for extras if applicable." : ""}

---

**3️⃣ Description (3 paragraphs)**
- Paragraph 1: Overview and appeal (${primaryVariant ? `mention "${primaryVariant}" naturally` : "no color mention"}).
- Paragraph 2: Specs, materials, category relevance.
- Paragraph 3: Why it’s a smart buy, extras if any.

${variantNote}

---

**4️⃣ What's in the Box**
- List what’s included clearly.
${primaryVariant ? `- Mention the color "${primaryVariant}" once if appropriate.` : "- Write generically without colors or variants."}
- Avoid repetition.

Output strictly as valid JSON:
{
 "title": "SEO optimized title",
 "highlights": ["H1","H2","H3","H4","H5","H6"],
 "description": "3 natural paragraphs",
 "whatsInTheBox": "Marketplace-friendly contents"
}
`;

    // 🧠 Call OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only assistant that outputs valid structured data optimized for online marketplaces.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");

    // ✅ Fallbacks
    const title =
      data.title ||
      (primaryVariant
        ? `${mainProduct} (${primaryVariant})`
        : `${mainProduct}${hasExtras ? " + " + extras.join(" + ") : ""}`);

    const highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : [
            "High-quality build and reliable performance",
            ...(primaryVariant ? [`Elegant ${primaryVariant} finish`] : []),
            ...(hasExtras ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct}${
        primaryVariant ? ` in ${primaryVariant}` : ""
      } offers excellent value and reliability for online shoppers. Designed for modern needs, it fits perfectly into the ${category} category.${
        hasExtras ? ` Includes ${extras.join(" and ")} for extra convenience.` : ""
      }`;

    let whatsInTheBox =
      data.whatsInTheBox ||
      `1 x ${mainProduct}${
        primaryVariant ? ` (${primaryVariant})` : ""
      }${hasExtras ? ", " + extras.map((i) => `1 x ${i}`).join(", ") : ""}`;

    // Remove empty parentheses or stray spaces if no color
    if (!primaryVariant) {
      whatsInTheBox = whatsInTheBox.replace(/\(\s*\)/g, "").trim();
    }

    // 🧾 SKU generation (auto-detect type)
    let skuData = null;
    if (generateSkus && finalVariants.length > 0) {
      const acronym = mainProduct
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
        .slice(0, 3);

      // 🧠 Detect variant type based on words
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
        skus: finalVariants.map((v) => ({
          [detectedLabel.toLowerCase()]: v,
          sku: `${acronym}-${v.toUpperCase().replace(/\s+/g, "")}`,
        })),
      };
    }

    // ✅ Final return
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
