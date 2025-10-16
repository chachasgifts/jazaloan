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

    // 🧩 Split main and extras
    const productParts = product.split("+").map(p => p.trim()).filter(Boolean);
    const mainProduct = productParts[0];
    const extras = productParts.slice(1);
    const hasExtras = extras.length > 0;

    // 🎨 Variants
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

    // 🧩 Smart count detection (extended)
    const countMatch =
      mainProduct.match(/(\d+)\s*(in|x|pack)/i) ||
      mainProduct.match(/(?:set|bundle|pack)\s*(of)?\s*(\d+)/i);
    const itemCount = countMatch
      ? parseInt(countMatch[1] || countMatch[2], 10)
      : 1;

    // 🧠 AI Prompt (full structured instruction)
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
- Do NOT mention color, size, or other variants in the title.
- Maintain natural Jumia-style marketplace tone.
- Must reflect what’s truly being sold.

---

2️⃣ **Highlights (6–8 bullets)**
- 6–10 words each.
- Focus mainly on the main product’s **features and benefits**.
- Do NOT mention colors, sizes, or variants.
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
  Do NOT mention variant or color.

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

    // 🧠 AI call
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 1200, // ✅ Increased for richer, full-length outputs
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
            ...(hasExtras ? [`Includes ${extras.join(" & ")}`] : []),
          ];

    const description =
      data.description ||
      `The ${mainProduct} offers great value and reliable performance for online shoppers. Perfect for ${category || "any"} category.${hasExtras ? ` Includes ${extras.join(" and ")}.` : ""}`;

    // 🧠 Enhanced getCoreName() — handles “4in1”, “3x”, “Set of 3”, “Bundle of 2”
    function getCoreName(name) {
      let cleaned = name
        .replace(/\(.*?\)/g, "")
        .replace(/\b\d+GB\b/gi, "")
        .replace(/\b\d+TB\b/gi, "")
        .replace(/\b\d+MHZ\b/gi, "")
        .replace(/\b\d+GHZ\b/gi, "")
        .replace(/\b\d{4}\b/g, "")
        .replace(/\b(refurbished|renewed|color|silver|black|white|blue|red|green|gold|grey|gray)\b/gi, "")
        .replace(/[–\-]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      // 🧩 NEW: remove bundle/count phrases
      cleaned = cleaned
        .replace(/\b\d+\s*(in\s*\d*|x|pack|pcs?|pieces?)\b/gi, "")
        .replace(/\b(set|bundle|pack)\s*(of)?\s*\d+\b/gi, "")
        .trim();

      const words = cleaned.split(" ");
      const lower = cleaned.toLowerCase();

      const keywordMap = {
        macbook: "Laptop",
        dell: "Laptop",
        hp: "Laptop",
        lenovo: "Laptop",
        infinix: "Smartphone",
        samsung: "Smartphone",
        tecno: "Smartphone",
        itel: "Smartphone",
        iphone: "Smartphone",
        oppo: "Smartphone",
        vivo: "Smartphone",
        xiaomi: "Smartphone",
        blender: "Blender",
        juicer: "Blender",
        kettle: "Electric Kettle",
        iron: "Dry Iron",
        shoe: "Shoes",
        sneakers: "Shoes",
        bag: "Bag",
        backpack: "Backpack",
        watch: "Watch",
        television: "Television",
        tv: "Television",
        soundbar: "Speaker",
        speaker: "Speaker",
        perfume: "Perfume",
        trouser: "Trouser",
        jeans: "Jeans",
        short: "Shorts",
        dress: "Dress",
        fan: "Fan",
        phone: "Smartphone",
        laptop: "Laptop",
        usb: "Flash Drive",
        flash: "Flash Drive",
      };

      for (const [key, type] of Object.entries(keywordMap)) {
        if (lower.includes(key)) {
          cleaned = cleaned.replace(new RegExp(`\\b${key}\\b`, "i"), key);
          return `${cleaned} ${type}`.trim();
        }
      }

      const commonNouns = [
        "laptop", "phone", "speaker", "watch", "bag", "shirt", "tv", "tablet",
        "iron", "kettle", "dress", "jeans", "fan", "blender", "set", "pair", "router", "drive"
      ];
      const found = words.find(w => commonNouns.includes(w.toLowerCase()));
      if (found)
        return `${cleaned} ${found.charAt(0).toUpperCase() + found.slice(1)}`;

      const lastWord = words[words.length - 1];
      return `${cleaned} ${lastWord.charAt(0).toUpperCase() + lastWord.slice(1)}`;
    }

    const coreProductName = getCoreName(mainProduct);

    // 🧠 Final Box Construction
    let whatsInTheBox = hasExtras
      ? `${itemCount}*${coreProductName}${extras
          .map((e) => ` + 1*${e.trim()}`)
          .join("")}`
      : `${itemCount}*${coreProductName}`;

    whatsInTheBox = whatsInTheBox.replace(/\s{2,}/g, " ").trim();

    // 🧾 SKU Generation (unchanged)
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
