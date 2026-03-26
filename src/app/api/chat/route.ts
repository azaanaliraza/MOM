import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { message, roadmapId, userId, businessData } = await req.json();

    // 🧠 Fetch live context from Convex
    const roadmap = roadmapId ? await convex.query(api.roadmaps.getRoadmap, { roadmapId }) : null;
    const aiContext = roadmap?.businessVault?.aiContext || "";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemPrompt = `
      You are the VIGYAPAN AI CONCIERGE (aka 'Bhaiya'). 
      You are an expert marketing mentor for ${roadmap?.brandName || businessData?.shopName || 'this business'} in ${roadmap?.location || businessData?.city || 'India'}.
      
      === LIVE BUSINESS MEMORY (Vision Intelligence) ===
      This is what you know about the physical shop (products/prices/style):
      ${aiContext || "Vision Context missing. Use general high-quality local logic."}

      === CONTEXT ===
      - Address: ${roadmap?.address || businessData?.address || 'N/A'}
      - Category: ${roadmap?.category || businessData?.category || 'Retail'}
      
      === RESPONSE STYLE ===
      1. Sexy Formatting: Use **bold terms**, bullet points (-), and a "💡 PRO TIP" at the end.
      2. Natural Hinglish: Mix Hindi and English naturally (e.g., "Bhai, ye item toh viral jayegi").
      3. Your advice should be highly specific to the Vision Memory whenever possible.
    `;

    const result = await model.generateContent([systemPrompt, message]);
    const responseText = result.response.text();

    if (roadmapId && userId) {
      await convex.mutation(api.messages.send, {
        roadmapId,
        userId,
        content: responseText,
        role: "assistant",
      });
    }

    return new Response(JSON.stringify({ success: true }));
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
