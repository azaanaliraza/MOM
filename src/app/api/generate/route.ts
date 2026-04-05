import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const {
      shopName,
      city,
      address,
      monthlyRevenue,
      category,
      whatsapp,
      initialPrompt,
      userId
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", details: "User identity is required." }, { status: 401 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Reverted to user's preferred stable version
      tools: [{ googleSearch: {} } as any],
      generationConfig: {
        maxOutputTokens: 16384,
        responseMimeType: "application/json",
      }
    });

    const businessDescription = `
      Shop Name: ${shopName}
      Location: ${city}, ${address}
      Category: ${category}
      Target Revenue Level: ${monthlyRevenue}
      WhatsApp: ${whatsapp}
      User's Goal: ${initialPrompt}
    `;

    const prompt = `
      You are MOM (Mother of Marketing) — भारत का सबसे smarter marketing brain for small businesses.
      Return ONLY a single valid JSON object. No other text before or after.
      CRITICAL: Be extremely concise to avoid character limits. Keep execution_steps short and actionable.
      
      You are an expert Indian digital marketing strategist with deep knowledge of Bharat (Tier 2/3 cities).

      ═══════════════════════════════════════════
      🇮🇳 USER BUSINESS CONTEXT (CRITICAL)
      ═══════════════════════════════════════════
      - Initial Business Description: ${initialPrompt}
      - Registered Shop Name: ${shopName}
      - City & Specific Location: ${city}, ${address}
      - Monthly Revenue Target: ${monthlyRevenue}
      - Category: ${category}
      - WhatsApp Contact: ${whatsapp}

      ═══════════════════════════════════════════
      🇮🇳 CORE KNOWLEDGE BASE (MUST APPLY)
      ═══════════════════════════════════════════

      1. WHATSAPP MARKETING (India's #1 tool):
      - Use WhatsApp Status as a 24-hour ad slot.
      - Leverage "Good Morning" culture — use festive wishes + product nudges.
      - Broadcast timing: 8AM, 12PM, 8PM for max open rates.
      - Voice note marketing: Use vernacular audio for 3x higher trust.
      - Highlight "Green Tick" and WhatsApp Pay for trust and friction-less buying.

      2. INSTAGRAM REELS MASTERY:
      - 7-second hook rule: Start with drama or local "masti" first.
      - Hinglish caption formula: 1 relatable line + offer + "Save Karo" CTA.
      - Collab with local micro-influencers (1K–10K followers) for highest trust.

      3. HINGLISH COMMUNICATION & CONSUMER BEHAVIOR:
      - Use "Paisa Vasool" triggers. Words like "Apna," "Desi," "Asli," and "Guarantee."
      - Emotional triggers: Family, savings, trust, and local landmarks ("Ghanta Ghar ke paas").
      - Urgency: "Sirf aaj ke liye," "Stock khatam hone wala hai."
      - Word-of-Mouth (WOM) focus: Create referral loops.

      4. HYPERLOCAL DELIVERY LOGIC:
      - FOOD/FMCG/GROCERY: Focus on Blinkit, Zepto, Zomato, and Swiggy. Use menu psychology and Hero-items.
      - NON-FOOD RETAIL (Sports/Electronics/Hardware): Do NOT suggest Swiggy/Blinkit. Suggest Porter (heavy), Borzo (light), ONDC Seller Hub (Mystore), and Shiprocket Quick.
      - EMPHASIZE: Google My Business (Local SEO). Post weekly offers and daily photos.

      5. NICHE EXPERTISE:
      - SWEET SHOP: Peak season pre-orders, Rasgulla-dipping Reels, B2B corporate gifting.
      - TYRE/HARDWARE: GMB "Near Me" searches, before/after photos, fleet owner WhatsApp groups.
      - SALON/BOUTIQUE: Wedding season packages, Reels of "Transition" looks, WhatsApp reminders.
      - COACHING: Result topper Reels, demo class campaigns, and value-first groups.

      ═══════════════════════════════════════════
      📊 OUTPUT INSTRUCTIONS
      ═══════════════════════════════════════════
      - Return ONLY a valid JSON object. No markdown, no text before or after the JSON.
      - Create 30 UNIQUE days. Each day must include specific "Tactical Steps" and "Recommended Tools" (e.g., Canva, Google Business, Porter App).
      - Use the Monthly Revenue Target (${monthlyRevenue}) to divide the Budget Plan.

      SCHEMA:
      {
        "brand": {
          "name": "${shopName}",
          "tagline": "...",
          "businessType": "${category}",
          "city": "${city}",
          "uniqueInsight": "..."
        },
        "marketingDNA": {
          "targetAudience": "...",
          "primaryChannels": ["WhatsApp", "Instagram", "ONDC", "GMB"],
          "toneOfVoice": "Apna / Relatable Hinglish",
          "topTriggers": ["Paisa Vasool", "Trust", "Desi"],
          "competitiveEdge": "..."
        },
        "platformStrategy": {
          "whatsapp": { "priority": "high", "tactics": [], "quickWin": "..." },
          "instagram": { "priority": "high", "contentPillars": [], "reelIdea": "...", "postingTime": "8 PM" },
          "googleMyBusiness": { "priority": "high", "keywords": [], "quickWin": "..." },
          "delivery": { "platforms": ["..."], "tips": "..." }
        },
        "weeklyThemes": [
          { "week": 1, "theme": "...", "focus": "...", "keyActivity": "...", "metric": "...", "hinglishQuote": "..." }
        ],
        "thirtyDayPlan": [
          { 
            "day": 1, 
            "label": "Action Title", 
            "status": "active",
            "insight": "Specific local data point for this business",
            "execution_steps": ["Step 1...", "Step 2..."],
            "recommended_tools": [{ "name": "...", "url": "...", "purpose": "..." }]
          }
        ],
        "festivalCalendar": { "upcomingFestivals": [], "quickCampaign": "..." },
        "budgetPlan": {
          "zeroRupee": [],
          "under500": [],
          "under2000": [],
          "roi_tip": "..."
        },
        "successMetrics": { "week1KPI": "...", "week2KPI": "...", "week4KPI": "...", "northStar": "..." }
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    console.log("[MOM Engine] Raw Gemini response length:", text.length);

    // Robust JSON Extraction
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}') + 1;

    if (startIdx === -1 || endIdx === 0) {
      throw new Error("No JSON object found in Gemini response");
    }

    const jsonString = text.substring(startIdx, endIdx).trim();
    let roadmapData: any;

    try {
      roadmapData = JSON.parse(jsonString);
    } catch (e: any) {
      console.error("[MOM Engine] JSON Parse failed. Likely truncated.");
      console.error("[MOM Engine] Error:", e.message);
      console.error("[MOM Engine] End of received text:", jsonString.substring(jsonString.length - 200));

      // Attempt fix for missing closing braces if truncated
      try {
        const cleaned = jsonString.substring(0, jsonString.lastIndexOf('}') + 1);
        roadmapData = JSON.parse(cleaned);
      } catch (innerError) {
        throw new Error(`Engine output was truncated or malformed: ${e.message}`);
      }
    }

    // 🔥 PUSH TO CONVEX WITH FULL METADATA
    await convex.mutation(api.roadmaps.createRoadmap, {
      userId: userId,
      brandName: shopName,      // 🆕 Use shopName variable
      location: city,           // 🆕 Use city variable
      address: address,
      category: category,
      monthlyRevenue: monthlyRevenue,
      whatsapp: whatsapp,
      data: roadmapData,        // The big JSON from Gemini
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("MOM Engine Error:", error.message);
    return NextResponse.json(
      { error: "Engine Failed", details: error.message },
      { status: 500 }
    );
  }
}
