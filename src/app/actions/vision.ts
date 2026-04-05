"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function processBusinessImage(base64Image: string, isPremium: boolean) {
  if (!isPremium) throw new Error("Unauthorized: Agent Vision is a Premium feature.");
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview",
      tools: [{ googleSearch: {} } as any]
    });

    // Clean Base64: Remove data:image/png;base64, etc.
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = "Extract product names, prices, and business info from this image. Format as a list.";

    let result;
    try {
      result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
        prompt,
      ]);
    } catch (e: any) {
      if (e.message?.includes("429") || e.message?.includes("quota")) {
        console.warn("[MOM Vision] Gemini 3 quota hit. Falling back to Gemini 2.5.");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        result = await fallbackModel.generateContent([
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
          prompt,
        ]);
      } else {
        throw e;
      }
    }

    const response = await result.response;
    const text = response.text();
    
    if (!text) throw new Error("Gemini returned no text");
    return text;

  } catch (error: any) {
    // This will print the REAL error in your terminal (e.g., API key expired or format error)
    console.error("Gemini Vision Error Details:", error.message);
    throw new Error(`Vision Error: ${error.message}`);
  }
}
