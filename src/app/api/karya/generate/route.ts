import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { aiContext, manualContext, dayTask, roadmapData, currentDay, brandName, location, category } = await req.json();

    if (!process.env.HF_TOKEN) {
      console.error("HF_TOKEN is missing in environment variables");
      return Response.json({ error: "HF_TOKEN is missing" }, { status: 500 });
    }
    
    // 🧠 Extract today's task details
    let taskName = dayTask || "General local outreach";
    let taskDescription = "Make the business stand out.";
    
    if (roadmapData && Array.isArray(roadmapData)) {
        const today = roadmapData.find((d: any) => d.day === currentDay || d.dayNumber === currentDay);
        if (today) {
            taskName = today.task || today.task_name || taskName;
            taskDescription = today.description || today.goal || taskDescription;
        }
    }

    // 🏗️ Step 1: The "Strict Task Executor" Prompt with Manual Context
    const strategyPrompt = `
      You are Agent Karya, the Marketing Lead for ${brandName || 'this shop'} in ${location || 'India'}.
      Your job is to take a specific task from a 30-day roadmap and give the shop owner a clear "How-To" guide.

      === KNOWLEDGE BASE ===
      1. AI Vision (From Photos): ${aiContext || "Missing context. Use general high-quality logic."}
      2. Manual Business Info: ${manualContext || "No additional info provided."} 

      === MISSION FOR TODAY ===
      Day: ${currentDay}
      Task Name: ${taskName}
      Task Description: ${taskDescription}

      === EXECUTION RULES (STRICT) ===
      1. GUIDANCE FIRST: Always start with a 3-5 step actionable checklist.
      2. CONTENT GENERATION: 
         - Generate a Reel script and Caption IF the task mentions Social Media/Post/Reel OR if the user provided specific 'Manual Business Info' (like a sale or new arrival) that deserves a shoutout.
      3. LANGUAGE: Use professional yet relatable Hinglish (mix of Hindi/English).
      4. FORMAT: Use clean Markdown. No JSON.

      === OUTPUT STRUCTURE ===

      # 📋 Day ${currentDay}: Action Plan
      **Task:** ${taskName}

      ### 🛠️ Step-by-Step Guide:
      1. [Actionable step based on the task and knowledge base]
      2. [Next logical action]
      3. [Final verification step]

      [IF CONTENT IS NEEDED, ADD THIS SECTION]
      ---
      ### 📱 Content Strategy
      **Type:** [Post/Reel]
      **Caption/Script:** [Hinglish content with emojis. Mention details from Manual Business Info if relevant.]
      **Visual Idea & Prompt:** [What to film/shoot. End this line with 'PROMPT: <Stable Diffusion prompt based on vision/manual data>']
      **Hashtags:** [Local & Niche]

      ---
      **✅ Goal for today:** [One sentence on what the owner will achieve by doing this]
    `;

    console.log("🚀 Agent Karya (Command Center) is strategizing...");

    const response = await hf.chatCompletion({
      model: "meta-llama/Llama-3.3-70B-Instruct", 
      messages: [
        { 
          role: "system", 
          content: "You are Agent Karya. You respond ONLY with tactical Markdown strategy. You synthesize Vision and Manual context." 
        },
        { 
          role: "user", 
          content: strategyPrompt 
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const body = response.choices[0].message.content || "";
    console.log("✅ Agent Karya strategy generated.");

    // 🕵️ Extract 'type' and 'prompts' logic
    let type = "text";
    if (body.toLowerCase().includes("reel script") || body.toLowerCase().includes("video")) type = "reel";
    else if (body.toLowerCase().includes("caption") || body.toLowerCase().includes("poster")) type = "poster";

    const promptMatch = body.match(/PROMPT:\s*(.*?)(\n|$)/);
    const imagePrompt = promptMatch ? promptMatch[1].trim() : "A professional marketing poster for a local shop";

    // Extract Instagram caption from the Content Strategy section
    const captionMatch = body.match(/\*\*Caption\/Script:\*\*\s*([\s\S]*?)(?=\n\*\*|\n---|\n#)/);
    let instagramCaption = captionMatch ? captionMatch[1].trim() : "";

    // Extract hashtags
    const hashtagMatch = body.match(/\*\*Hashtags:\*\*\s*(.*?)(\n|$)/);
    const hashtags = hashtagMatch ? hashtagMatch[1].trim() : "";

    // If no caption was extracted, create a short one from context
    if (!instagramCaption) {
      instagramCaption = `✨ ${taskName} | ${brandName || "Your Local Fav"} 📍 ${location || "India"}\n\nAaj ka special update tumhare liye! 🔥\n\n${hashtags || "#LocalBusiness #ShopLocal #Growth"}`;
    } else if (hashtags && !instagramCaption.includes("#")) {
      instagramCaption += `\n\n${hashtags}`;
    }

    return Response.json({ 
        report: body, 
        type,
        imagePrompt,
        videoPrompt: imagePrompt,
        instagramCaption,
    });

  } catch (error: any) {
    console.error("❌ Agent Karya Error:", error.message);
    return Response.json({ 
      error: "Agent is busy. Try in 10s.",
      details: error.message
    }, { status: 500 });
  }
}
