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

    // ⚠️ If SKUs requested but no variants at all
    if (generateSkus && finalVariants.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Please enter at least one variant (e.g. Red, Blue, Small, Large) before generating SKUs.",
        }),
      };
    }

    // 🧠 Variant control logic — what to tell the model
    let variantNote = "";
    if (primaryVariant && variantList.length === 0) {
      variantNote = `Include the color or variant "${primaryVariant}" naturally throughout the listing (title, highlights, description, and what's in the box).`;
    } else if (primaryVariant && variantList.length > 0) {
      variantNote = `Use only the color or variant "${primaryVariant}" for the listing content. 
      Completely ignore any other variants provided. 
      These other variants will only be used for SKU generation.`;
    } else {
      variantNote = `Write a neutral, variant-free listing with no color or size mentions.`;
    }

    // 🧠 Construct the AI prompt
    const prompt = `
You are an expert copywriter for **SEO-optimized, marketplace-ready product listings** for platforms like **Jumia, Konga, and Amazon**.  
Use **our tool’s expert formatting style** and generate listings that read like human-crafted, persuasive product copy.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Category: ${category || "General"}
Price: ${price || "N/A"}
${primaryVariant ? `Primary Variant (from description): ${primaryVariant}` : "No primary color or variant provided"}

---

### 🧩 Writing Instructions

**1️⃣ Title (60–70 characters)**
${hasExtras
  ? `- Include the main product and any extras separated by a plus sign (+).`
  : `- Focus on the main product and its key attributes.`}
- Maintain a clean, professional marketplace tone.
- ${
      primaryVariant
        ? `Include the color or variant "${primaryVariant}" naturally in the title and highlights.`
        : "Do NOT include color, size, or variant mentions."
    }

---

**2️⃣ Highlights (6–8 bullets)**
- Emphasize core benefits, materials, and key features.
- Avoid variant mentions unless told otherwise.
${primaryVariant ? `- Include one bullet that mentions "${primaryVariant}" naturally.` : ""}
${hasExtras ? "- Add one bullet for extras if applicable." : ""}

---

**3️⃣ Description (3 paragraphs – Each paragraph must be natural, SEO-rich, and complete)**

💡 **Important SEO Rule:**  
Make sure **keywords or key phrases from the title** (such as product type, category, and any strong descriptors) appear naturally across the description.  
Do not repeat them awkwardly — make the writing flow smoothly and sound like a professional marketplace listing.

- **Paragraph 1 – Overview / Value Hook**  
  Describe what the product is, who it’s for, and what makes it stand out.  
  Naturally mention value for money (without numbers).  
  ${
    primaryVariant
      ? `Mention "${primaryVariant}" naturally here once.`
      : "Do NOT mention color or variant."
  }

- **Paragraph 2 – Product Data & Benefits**  
  Include *basic specs, materials, and performance details*.  
  Mention *product identifiers* like model name or type if applicable.  
  Provide context in its category (e.g. electronics, apparel, etc.).  
  Do NOT mention variant or color.

- **Paragraph 3 – Smart Buy Justification & Distribution Readiness**  
  Explain why it’s a smart choice or thoughtful gift.  
  Mention reliability, ease of use, delivery readiness, and marketplace suitability.  
  Mention extras only if applicable (${hasExtras ? "yes" : "no"}).  

${variantNote}

---

**4️⃣ What's in the Box**
- List the included items clearly and naturally.
${primaryVariant ? `- Mention "${primaryVariant}" once if appropriate.` : "- Do not mention any color or variant."}
- Keep tone professional and natural.

Output strictly as **valid JSON** only:

{
 "title": "SEO optimized title",
 "highlights": ["H1","H2","H3","H4","H5","H6"],
 "description": "3 structured, natural paragraphs including some title keywords",
 "whatsInTheBox": "Marketplace-style contents"
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

    // ✅ Safe fallbacks
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
            ...(primaryVariant ? [`Elegant ${primaryVariant} design`] : []),
            ...(hasExtras ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct}${
        primaryVariant ? ` in ${primaryVariant}` : ""
      } offers great value, durability, and style for online shoppers. Perfectly suited for the ${category} category.${
        hasExtras ? ` Includes ${extras.join(" and ")} for added value.` : ""
      }`;

    let whatsInTheBox =
      data.whatsInTheBox ||
      `1 x ${mainProduct}${
        primaryVariant ? ` (${primaryVariant})` : ""
      }${hasExtras ? ", " + extras.map((i) => `1 x ${i}`).join(", ") : ""}`;

    // 🧹 Clean output
    whatsInTheBox = whatsInTheBox.replace(/\(\s*\)/g, "").replace(/\s{2,}/g, " ").trim();

    // 🧾 SKU generation logic
    let skuData = null;
    if (generateSkus && finalVariants.length > 0) {
      const acronym = mainProduct
        .split(" ")
        .map((w) => w[0])
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
        skus: finalVariants.map((v) => ({
          [detectedLabel.toLowerCase()]: v,
          sku: `${acronym}-${v.toUpperCase().replace(/\s+/g, "")}`,
        })),
      };
    }

    // ✅ Final response
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
