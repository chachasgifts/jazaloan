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

    // 🧠 Stronger AI instruction enforcement
    const variantNote = primaryVariant
      ? `Use only the color "${primaryVariant}" for all parts of the listing.
Do not mention any other colors, sizes, or the word "variants" anywhere.`
      : `Write a neutral listing with no color or variant references.`;

    // 🧩 Smart count detection
    const countMatch = mainProduct.match(/(\d+)\s*(in|x|pack)/i);
    const itemCount = countMatch ? parseInt(countMatch[1], 10) : 1;

    // 🧠 AI Prompt — With strict writing rules
    const prompt = `
You are an expert copywriter for SEO-optimized, marketplace-ready product listings.
Generate persuasive, natural listings with human-quality tone.

Main Product: "${mainProduct}"
${hasExtras ? `Additional/Bundled Items: ${extras.join(", ")}` : ""}
Category: ${category || "General"}
Price: ${price || "N/A"}
${primaryVariant ? `Primary Color: ${primaryVariant}` : "No primary color detected"}

---

### 🧩 Detailed Writing Instructions
(omitted for brevity — identical to previous version)
`;

    // 🧠 Generate via OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 1.0,
      max_tokens: 900,
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

    // 🧠 Advanced Intelligent getCoreName()
    function getCoreName(name) {
      // 🧹 Clean raw noise
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

      const words = cleaned.split(" ");
      const lower = cleaned.toLowerCase();

      // 🧠 Smart mapping of known terms to product categories
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
        t: "T-Shirt",
        shirt: "Shirt",
        hoodie: "Hoodie",
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
      };

      // 🧠 Step 1: Try direct mapping from name
      for (const [key, type] of Object.entries(keywordMap)) {
        if (lower.includes(key)) {
          cleaned = cleaned.replace(new RegExp(`\\b${key}\\b`, "i"), key);
          return `${cleaned} ${type}`.trim();
        }
      }

      // 🧠 Step 2: Try to detect the last noun-like term
      const commonNouns = [
        "laptop", "phone", "speaker", "watch", "bag", "shirt", "tv", "tablet",
        "iron", "kettle", "dress", "jeans", "fan", "blender", "set", "pair", "router"
      ];
      const found = words.find(w => commonNouns.includes(w.toLowerCase()));
      if (found) return `${cleaned} ${found.charAt(0).toUpperCase() + found.slice(1)}`;

      // 🧠 Step 3: Default fallback
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

    // ✅ Return final JSON
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
