<script>
async function generateListing() {
  const generateBtn = document.getElementById("generateBtn");
  const product = document.getElementById("productInput").value.trim();
  const color = document.getElementById("colorInput").value.trim();
  const resultDiv = document.getElementById("listingResult");

  if (!product) {
    resultDiv.innerHTML = "<p style='color:red;'>Please enter a product name.</p>";
    return;
  }

  // Clear previous results
  resultDiv.innerHTML = "";

  // Disable button while generating
  generateBtn.disabled = true;
  generateBtn.innerHTML = `<span class="spinner"></span> Generating...`;

  // Create progress container
  const loader = document.createElement("div");
  loader.style = `
    background:#f9f9f9;
    padding:25px;
    border-radius:10px;
    text-align:center;
    color:#2c3e50;
    font-size:16px;
    box-shadow:0 1px 4px rgba(0,0,0,0.1);
  `;

  // Add progress bar + status text
  loader.innerHTML = `
    <div id="progressText">🔍 Starting analysis...</div>
    <div style="width:100%;background:#eee;border-radius:8px;height:10px;margin-top:12px;overflow:hidden;">
      <div id="progressBar" style="width:0%;height:100%;background:linear-gradient(135deg,#007bff,#00c3ff);transition:width 0.4s ease;"></div>
    </div>
  `;
  resultDiv.appendChild(loader);

  // Scroll to loader
  loader.scrollIntoView({ behavior: "smooth", block: "center" });

  const steps = [
    "🧠 Analyzing keywords...",
    "✍️ Writing optimized title...",
    "✨ Creating highlights...",
    "📝 Crafting product description...",
    "📦 Finalizing 'What’s in the Box'..."
  ];

  let progress = 0;
  let stepIndex = 0;
  const progressText = document.getElementById("progressText");
  const progressBar = document.getElementById("progressBar");

  // Animate progress bar and status
  const interval = setInterval(() => {
    if (stepIndex < steps.length) progressText.textContent = steps[stepIndex++];
    progress = Math.min(progress + 15, 90);
    progressBar.style.width = progress + "%";
  }, 900);

  // Enforce smooth pacing
  const minLoadingTime = new Promise((res) => setTimeout(res, 1200));

  try {
    const [response] = await Promise.all([
      fetch("/.netlify/functions/listing-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, color }),
      }),
      minLoadingTime,
    ]);

    const data = await response.json();
    clearInterval(interval);
    progressBar.style.width = "100%";
    progressText.textContent = "✅ Done! Preparing results...";

    await new Promise((r) => setTimeout(r, 600)); // short pause for realism

    if (data.error) {
      resultDiv.innerHTML = `<p style="color:red;">⚠️ ${data.error}</p>`;
      return;
    }

    // Safeguards
    const titleText = data.title || "SEO Optimized Product Title";
    const descriptionText = data.description || "No description available";
    const highlightsHTML = Array.isArray(data.highlights)
      ? "<ul>" + data.highlights.map(h => `<li>${h}</li>`).join("") + "</ul>"
      : "<p>No highlights available</p>";
    const whatsInTheBoxText = data.whatsInTheBox || `1 x ${titleText}`;

    // Render final listing
    resultDiv.innerHTML = `
      <div id="resultsBox" class="fade-in"
           style="background:#f9f9f9;padding:20px;border-radius:10px;
           display:flex;flex-direction:column;gap:20px;">

        <div style="border:1px solid #ddd;padding:10px;border-radius:6px;">
          <h3 style="margin-top:0;">Title</h3>
          <h2 style="color:#2c3e50;margin:10px 0 0;">${titleText}</h2>
        </div>

        <div style="border:1px solid #ddd;padding:10px;border-radius:6px;">
          <h3>Description</h3>
          <p>${descriptionText.replace(/\n/g, "</p><p>")}</p>
        </div>

        <div style="border:1px solid #ddd;padding:10px;border-radius:6px;">
          <h3>Key Highlights</h3>
          ${highlightsHTML}
        </div>

        <div style="border:1px solid #ddd;padding:10px;border-radius:6px;">
          <h3>What's in the Box</h3>
          <p>${whatsInTheBoxText}</p>
        </div>

        <div id="actionButtons" style="display:flex;justify-content:center;margin-top:15px;">
          <button onclick="restartTool()" class="cta-btn">
            ✨ Generate Another Listing
          </button>
        </div>
      </div>
    `;

    document.getElementById("resultsBox")
      .scrollIntoView({ behavior: "smooth", block: "center" });

  } catch (err) {
    clearInterval(interval);
    resultDiv.innerHTML = `<p style="color:red;">❌ Error: ${err.message}</p>`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = "⚡ Generate Listing";
  }
}

// Restart tool
function restartTool() {
  document.getElementById("listingResult").innerHTML = "";
  document.getElementById("productInput").value = "";
  document.getElementById("colorInput").value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("productInput").focus();
}
</script>
