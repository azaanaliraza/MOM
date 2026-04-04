const { ComposioToolSet } = require("composio-core");
require('dotenv').config({ path: '.env.local' });

async function listApps() {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    console.error("[ERROR] No API key found in .env.local");
    return;
  }
  const toolset = new ComposioToolSet({ apiKey });
  
  try {
    console.log("[STATUS] Fetching apps...");
    const apps = await toolset.getApps();
    console.log(`[STATUS] Found ${apps.length} apps.`);
    
    for (const app of apps) {
      if (app.name.toLowerCase().includes("insta") || app.name.toLowerCase().includes("google")) {
        console.log(`[APP] Name: ${app.name}, Name (ID?): ${app.id}`);
      }
    }
  } catch (err) {
    console.error("[ERROR] Failed to fetch apps:", err);
  }
}

listApps();
