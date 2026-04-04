"use node";

import { internalAction, action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Agent Karya AI Engine
 * This file handles AI-driven context extraction and task refinement.
 */

export const extractBusinessContext = internalAction({
  args: {
    businessName: v.string(),
    city: v.string(),
    description: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Act as an expert local marketing strategist. 
    Analyze this business: ${args.businessName} in ${args.city}. 
    Additional Context: ${args.description || "N/A"}
    
    Identify the top 3 selling points and the target audience demographics for this specific local area.
    Return a short, punchy marketing profile in 3-4 sentences.`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.error("AI Context Error:", e);
      return "Local business specializing in high-quality service and community engagement.";
    }
  }
});

export const generateTaskContent = internalAction({
  args: {
    prompt: v.string(),
    businessContext: v.string()
  },
  handler: async (ctx, args) => {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const aiPrompt = `You are Agent Karya, an expert local marketing strategist.
    Context: ${args.businessContext}
    Goal: Create actionable content for this daily task: "${args.prompt}"
    
    Provide the response strictly in JSON format with the following keys:
    - reel_script: (String) A short script for an Instagram Reel.
    - instagram_caption: (String) A compelling Instagram caption with emojis and hashtags.
    - gmb_post: (String) A concise update for Google My Business (GMB) highlighting local appeal.
    - image_prompt: (String) A highly detailed, aesthetic description for generating an image. Describe the ideal visual to accompany this post.`;

    try {
      const result = await model.generateContent(aiPrompt);
      const text = result.response.text();
      // Clean up markdown block if present
      const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed.image_prompt) {
        parsed.imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(parsed.image_prompt)}?width=1080&height=1920&nologo=true`;
      }
      return parsed;
    } catch (e) {
      console.error("Agent Karya Generation Error:", e);
      return {
        reel_script: "Today, focus on what makes your business unique!",
        instagram_caption: "Ready for an amazing day at our shop! ✨ #LocalBusiness #Growth",
        gmb_post: "Visit us today to see our latest offerings! We love serving our community."
      };
    }
  }
});
