import puppeteer from 'puppeteer';

export async function POST(req: Request) {
  let browser;
  try {
    const { links, url } = await req.json();
    const finalLinks = links || (url ? [url] : []);

    if (finalLinks.length === 0) {
      return Response.json({ error: "Please provide business links to audit." }, { status: 400 });
    }

    browser = await puppeteer.launch({ 
      headless: true, // Standard headless
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    const results: any[] = [];

    for (const link of finalLinks.slice(0, 10)) {
      const page = await browser.newPage();
      try {
        // High-stealth mobile profile
        await page.setViewport({ width: 390, height: 844 });
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

        // Bypassing some common detection markers
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
          // @ts-ignore
          window.chrome = { runtime: {} };
          // @ts-ignore
          navigator.languages = ['en-US', 'en'];
        });

        // Use 'domcontentloaded' or 'load' instead of 'networkidle2' for speed/reliability on slow proxy/sites
        await page.goto(link, { waitUntil: 'load', timeout: 45000 });

        // 🍪 Bypassing Consent Screen (Cookie banner) for Google/Amazon
        try {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const consent = buttons.find(b => 
                    b.innerText.includes('Accept all') || 
                    b.innerText.includes('I agree') || 
                    b.innerText.includes('Allow all') ||
                    b.innerText.includes('Accept cookies')
                );
                if (consent) (consent as any).click();
            });
            await new Promise(r => setTimeout(r, 1000)); // Pause for clear
        } catch (e) {
            // No consent screen found
        }

        // 🧠 OMNI-CRAWLER LOGIC: Specialized extraction for local Indian & Global platforms
        const data = await page.evaluate((currentUrl) => {
          const bodyText = document.body.innerText;
          const title = document.title;
          const html = document.documentElement.innerHTML;

          // 1. 🗺️ Google Maps Profile
          if (currentUrl.includes("google.com/maps") || currentUrl.includes("g.page")) {
            const rating = bodyText.match(/(\d\.\d) stars/)?.[1] || "No Rating";
            const reviews = bodyText.match(/(\d+,?\d*) reviews/)?.[1] || "0 Reviews";
            const name = document.querySelector('h1')?.textContent || title;
            return { type: "GMB", name, rating, reviews, context: "Audit active metrics" };
          }

          // 2. 🔍 Google Search Results
          if (currentUrl.includes("google.com/search")) {
            const snippets = Array.from(document.querySelectorAll('div[data-asrc], div.VwiC3b, div.BNeawe')).slice(0, 3).map(el => el.textContent).join(" | ");
            return { type: "GoogleSearch", name: "Search Results", snippet: snippets || "Visibility results hidden", context: "Brand visibility" };
          }

          // 3. 🍴 Zomato 
          if (currentUrl.includes("zomato.com")) {
            const rating = document.querySelector('[itemprop="ratingValue"]')?.textContent || 
                           bodyText.match(/(\d\.\d) Dining Rating/)?.[1] || 
                           bodyText.match(/(\d\.\d) stars/)?.[1] || "Unknown";
            const deliveryRating = bodyText.match(/(\d\.\d) Delivery Rating/)?.[1] || "Unknown";
            return { type: "Zomato", name: title, rating, deliveryRating, context: "Food demand reputation" };
          }

          // 4. 🛵 Swiggy 
          if (currentUrl.includes("swiggy.com")) {
            const rating = bodyText.match(/(\d\.\d) \(\d+ ratings\)/)?.[1] || "Unknown";
            const offers = bodyText.includes("% OFF") || bodyText.includes("Flat ₹") ? "Active Discounts Found" : "Standard Pricing";
            return { type: "Swiggy", name: title, rating, offers, context: "Delivery platform strategy" };
          }

          // 5. 📦 Amazon
          if (currentUrl.includes("amazon")) {
            const price = document.querySelector('.a-price-whole')?.textContent || 
                          bodyText.match(/₹(\d+,?\d*)/)?.[1] || "Check listing";
            const ratingCount = bodyText.match(/(\d+,?\d*) global ratings/)?.[1] || "0";
            return { type: "Amazon", name: title, price, ratingCount, context: "Market price bench" };
          }

          // 6. 📱 Instagram
          if (currentUrl.includes("instagram.com")) {
            const posts = bodyText.match(/(\d+) posts/)?.[1] || "Unknown";
            return { type: "Instagram", name: title, postCount: posts, context: "Social pulse check" };
          }

          // 7. 🌐 General / Catch-all
          return { type: "General", name: title, summary: bodyText.substring(0, 300).replace(/\s+/g, ' '), context: "Business landing" };
        }, link);

        results.push({ url: link, ...data });
      } catch (e: any) {
        console.error(`Link audit failed ${link}:`, e.message);
        results.push({ url: link, error: "Access Timeout" });
      } finally {
        await page.close();
      }
    }

    await browser.close();
    return Response.json({ auditSummary: results });

  } catch (error: any) {
    console.error("Critical Omni-audit Error:", error.message);
    if (browser) await browser.close();
    return Response.json({ error: "Audit engine timed out or blocked." }, { status: 500 });
  }
}
