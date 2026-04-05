import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const extractContext = action({
  args: {
    storageId: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get the image URL from storage
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image not found");

    // 2. Fetch the image content
    const response = await fetch(imageUrl);
    const imageData = await response.arrayBuffer();

    // 3. Prompt Gemini 1.5 Flash
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      tools: [{ googleSearch: {} } as any]
    });

    const prompt = "Extract every detail from this image: product names, prices, special offers, and the overall vibe. Format it as a structured summary for a marketing agent.";

    let result;
    const base64Data = arrayBufferToBase64(imageData);
    
    try {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: args.mimeType,
          },
        },
      ]);
    } catch (e: any) {
      if (e.message?.includes("429") || e.message?.includes("quota")) {
        console.warn("[MOM Vision] Gemini 3 quota hit. Falling back to Gemini 2.5.");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        result = await fallbackModel.generateContent([
          prompt,
          { inlineData: { data: base64Data, mimeType: args.mimeType } },
        ]);
      } else {
        throw e;
      }
    }

    const context = result.response.text();
    return { context };
  },
});
