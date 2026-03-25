import { GoogleGenerativeAI } from "@google/generative-ai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const { message, roadmapId, userId, businessData } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const systemPrompt = `
      You are the VIGYAPAN AI CONCIERGE. You are an expert marketing mentor for ${businessData?.shopName || 'this business'} in ${businessData?.city || 'this city'}.
      
      BUSINESS CONTEXT:
      - Address: ${businessData?.address || 'N/A'}
      - Category: ${businessData?.category || 'Retail'}
      - Target Revenue: ${businessData?.monthlyRevenue || 'N/A'}
      - Logistics Logic: ${businessData?.category === 'Food' ? 'Zomato/Blinkit' : 'Porter/Shiprocket'}

      RESPONSE STYLE:
      1. Use "Sexy" formatting: Use Bold for key terms (e.g. **keyword**), Bullet points for steps (starting with -), and a "💡 PRO TIP" at the end.
      2. Use Hinglish: Mix Hindi and English naturally (e.g., "Bhai, ye strategy ekdum solid hai").
      3. Be Hyper-Local: Mention landmarks or behavior specific to ${businessData?.city || 'the area'}.
      4. Focus on ROI: Always link advice back to the goal of ${businessData?.monthlyRevenue || 'growth'}.
    `;

    const result = await model.generateContent([systemPrompt, message]);
    const responseText = result.response.text();

    // Save AI's response to Convex
    await convex.mutation(api.messages.send, {
      roadmapId,
      userId,
      content: responseText,
      role: "assistant",
    });

    return new Response(JSON.stringify({ success: true }));
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
