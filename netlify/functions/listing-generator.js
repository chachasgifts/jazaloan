// file: /api/generateProductListing.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event) {
  try {
    const {
      product,
      color: primaryVariant,
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
    const inputText = [product, category, ...extras].join(" ").toLowerCase();
    const hasWarranty = inputText.includes("warranty");

    const variantList = Array.isArray(allVariants)
      ? allVariants.filter(Boolean)
      : [];
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

    // ✅ Improved count detection (includes prefixes like x2, 2pcs, etc.)
    let itemCount = 1;
    const countMatch =
      mainProduct.match(/(\d+)\s*(x|pack|pcs|pieces|set|bundle)/i) ||
      mainProduct.match(/(?:set|bundle|pack)\s*(of)?\s*(\d+)/i) ||
      mainProduct.match(/x\s*(\d+)/i);

    if (/\d+\s*(in\s*1|in\s*one)\b/i.test(mainProduct)) {
      itemCount = 1;
    } else if (countMatch) {
      const matchedNumber = parseInt(
        countMatch[1] || countMatch[2] || countMatch[3],
        10
      );
      if (!isNaN(matchedNumber)) itemCount = matchedNumber;
    }

    const prompt = `
You are an expert copywriter for SEO-optimized, marketplace-ready product listings.
Generate persuasive, natural listings with human-quality tone.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Category: ${category || "General"}
Price: ${price || "N/A"}
${primaryVariant ? `Primary Color: ${primaryVariant}` : "No primary color detected"}

---

1️⃣ **Title (60–70 characters)**
${hasExtras
  ? `- Include both the main product and the additional item(s), separated by a plus sign (+).
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM + Free Pen”.`
  : `- Focus only on the main product (no extras or variant colors/sizes).
- Example: “Samsung Galaxy A16 Smartphone – 128GB, 4GB RAM”.`}
- You may naturally mention the product color (if provided) when relevant.
- Avoid repeating the color unnecessarily.
- Maintain natural Jumia-style marketplace tone.
- Must reflect what’s truly being sold.

---

2️⃣ **Highlights (6–8 bullets)**
- 6–10 words each.
- Focus mainly on the main product’s **features and benefits**.
- You may naturally mention the product color (if provided) when relevant.
- Avoid repeating the color unnecessarily.
${hasExtras ? "- Optional final bullet can mention the bonus item if applicable." : ""}

---

3️⃣ **Description (3 structured paragraphs)**
Each paragraph should be natural, SEO-rich, and complete.

- **Paragraph 1 – Overview / Value Hook**
  Describe what the product is, who it’s for, and what makes it stand out.
  Naturally mention value for money (without numbers).

- **Paragraph 2 – Product Data & Benefits**
  Include *basic specs, materials, and performance details*.
  Mention *product identifiers* like model name or type if applicable.
  Provide context in its category (e.g. electronics, apparel, etc.).
  You may naturally mention the product color (if provided) when relevant.
  Avoid repeating the color unnecessarily.

- **Paragraph 3 – Smart Buy Justification & Distribution Readiness**
  Explain why it’s a smart choice or thoughtful gift.
  Mention reliability, ease of use, delivery readiness, and online marketplace suitability.
  Mention extras only if applicable.

Ensure smooth transitions, professional tone, and no repeated lines.

Output in **pure JSON** with keys:
{
  "title": "",
  "highlights": ["", "", ...],
  "description": ""
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are a JSON-only assistant that outputs structured data optimized for eCommerce listings.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const data = JSON.parse(response.choices[0].message.content || "{}");

    let title =
      data.title ||
      (primaryVariant
        ? `${mainProduct} (${primaryVariant})`
        : mainProduct);

    let highlights =
      Array.isArray(data.highlights) && data.highlights.length > 0
        ? data.highlights
        : [
            "High-quality build and reliable performance",
            ...(hasExtras ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    let description =
      data.description ||
      `The ${mainProduct} offers great value and reliable performance for online shoppers. Perfect for ${category || "any"} category.${hasExtras ? ` Includes ${extras.join(" and ")}.` : ""}`;

    if (primaryVariant) {
      const colorNorm =
        primaryVariant.charAt(0).toUpperCase() +
        primaryVariant.slice(1).toLowerCase();
      const colorRegex = new RegExp(`\\b${primaryVariant}\\b`, "i");

      if (!colorRegex.test(title)) title = `${title} - ${colorNorm}`;
      if (!colorRegex.test(description))
        description += ` Available in elegant ${colorNorm} color.`;
      if (!highlights.some(h => colorRegex.test(h)))
        highlights.push(`Stylish design in elegant ${colorNorm} color`);
    }

    if (hasWarranty) {
      if (!highlights.some(h => /warranty/i.test(h))) {
        highlights.push("Comes with a reliable product warranty");
      }
      if (!/warranty/i.test(description)) {
        description += " This product includes an official warranty for added peace of mind.";
      }
    }

    function getCoreName(name) {
      let cleaned = name
        .replace(/\(.*?\)/g, "")
        .replace(/\bwith.*$/i, "")
        .replace(/\bfor.*$/i, "")
        .replace(/\b(multimedia|system|set|bundle|pack|pcs?|pieces?)\b/gi, "")
        .replace(/\b\d+GB\b/gi, "")
        .replace(/\b\d+TB\b/gi, "")
        .replace(/\b\d{4}\b/g, "")
        .replace(/[–\-]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      cleaned = cleaned
        .replace(/^(?:\d+\s*(x|pcs?|pieces?|pack|set|bundle)\b|x\s*\d+)/i, "")
        .trim();

      return cleaned;
    }

    let coreProductName = getCoreName(mainProduct);

    if (primaryVariant) {
      const colorCap =
        primaryVariant.charAt(0).toUpperCase() +
        primaryVariant.slice(1).toLowerCase();
      if (!new RegExp(`\\b${colorCap}\\b`, "i").test(coreProductName))
        coreProductName = `${colorCap} ${coreProductName}`;
    }

    function pluralize(name, count) {
      if (count <= 1) return name;
      if (/\bT-?shirt\b/i.test(name)) return name.replace(/T-?shirt/i, "T-shirts");
      if (/\bShorts?\b/i.test(name)) return name.replace(/Shorts?/i, "Shorts");
      if (/\bSocks?\b/i.test(name)) return name.replace(/Socks?/i, "Socks");
      return name;
    }

    coreProductName = pluralize(coreProductName, itemCount);

    // ✅ UPDATED: Smart combination of structure + AI title
    let whatsInTheBox = `${itemCount} x ${coreProductName} (as described in title: ${title})`;

    if (hasWarranty)
      whatsInTheBox = whatsInTheBox.replace(/warranty/gi, "").trim();

    whatsInTheBox = whatsInTheBox.replace(/\s{2,}/g, " ").trim();

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
        "xs","s","m","l","xl","xxl","xxxl","small","medium","large","extra large",
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

      const allForSkus = new Set(finalVariants);
      if (primaryVariant && !lowerVariants.includes(primaryVariant.toLowerCase())) {
        allForSkus.add(primaryVariant);
      }

      skuData = {
        label: detectedLabel,
        skus: Array.from(allForSkus).map(v => {
          const norm = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();

          // ✅ Format SKU as PRODUCTCODE-SIZE-COLOR
          const upperNorm = norm.toUpperCase().replace(/\s+/g, "");
          let skuParts = [acronym];

          if (sizes.includes(v.toLowerCase())) {
            skuParts.push(upperNorm);
            if (primaryVariant && colors.includes(primaryVariant.toLowerCase())) {
              skuParts.push(primaryVariant.toUpperCase().replace(/\s+/g, ""));
            }
          } else if (colors.includes(v.toLowerCase())) {
            if (size && sizes.includes(size.toLowerCase())) {
              skuParts.push(size.toUpperCase().replace(/\s+/g, ""));
            }
            skuParts.push(upperNorm);
          } else {
            skuParts.push(upperNorm);
          }

          return {
            [detectedLabel.toLowerCase()]: norm,
            sku: skuParts.join("-"),
          };
        }),
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
