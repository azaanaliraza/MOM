#!/usr/bin/env node

/**
 * MOM (Mother of Marketing) — MCP Server
 *
 * Exposes every MOM platform capability as an MCP tool.
 *   • Data tools  → ConvexHttpClient (always available)
 *   • AI tools    → fetch() to the running Next.js dev server
 *
 * Start:  bun run mcp
 * Requires:  bun dev  (Next.js) running in another terminal for AI tools
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

// ── Config ────────────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL not set. Check your .env.local");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// ── Helpers ───────────────────────────────────────────────────────────
async function callApi(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${SITE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.details || `API ${path} failed (${res.status})`);
  }
  return res.json();
}

function text(msg: string) {
  return { content: [{ type: "text" as const, text: msg }] };
}

function json(label: string, data: unknown) {
  return text(`${label}\n\n${JSON.stringify(data, null, 2)}`);
}

function errorResult(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
}

// ── MCP Server ────────────────────────────────────────────────────────
const server = new Server(
  { name: "mom-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// =====================================================================
//  TOOL DEFINITIONS
// =====================================================================
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ─── Roadmap Generation ─────────────────────────────────────
    {
      name: "generate_roadmap",
      description:
        "Generate a full AI-powered 30-day marketing roadmap for an Indian small business. " +
        "Uses Gemini to create a hyper-local strategy with daily tasks, weekly themes, " +
        "budget plans, and festival calendar. The roadmap is saved to Convex automatically. " +
        "Requires the Next.js dev server to be running.",
      inputSchema: {
        type: "object",
        properties: {
          shopName:       { type: "string", description: "Business/shop name" },
          city:           { type: "string", description: "City where the business operates" },
          address:        { type: "string", description: "Specific address or locality" },
          category:       { type: "string", description: "Business category (e.g. Sweet Shop, Salon, Hardware)" },
          monthlyRevenue: { type: "string", description: "Approximate monthly revenue (e.g. '₹50,000-1,00,000')" },
          whatsapp:       { type: "string", description: "WhatsApp number for the business" },
          initialPrompt:  { type: "string", description: "User's description of their business and goals" },
          userId:         { type: "string", description: "Clerk user ID" },
        },
        required: ["shopName", "city", "initialPrompt", "userId"],
      },
    },

    // ─── Roadmap Data ───────────────────────────────────────────
    {
      name: "list_roadmaps",
      description:
        "List all marketing roadmaps created by a specific user. " +
        "Returns brand names, locations, and roadmap IDs.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "Clerk user ID" },
        },
        required: ["userId"],
      },
    },
    {
      name: "get_roadmap",
      description:
        "Get the full details of a specific roadmap including the 30-day plan, " +
        "weekly themes, marketing DNA, budget plan, and completion status.",
      inputSchema: {
        type: "object",
        properties: {
          roadmapId: { type: "string", description: "Convex document ID for the roadmap" },
        },
        required: ["roadmapId"],
      },
    },
    {
      name: "get_latest_roadmap",
      description:
        "Get the most recently created roadmap for a user. " +
        "Useful to check the current active strategy.",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "Clerk user ID" },
        },
        required: ["userId"],
      },
    },

    // ─── Task Completion ────────────────────────────────────────
    {
      name: "toggle_task_completion",
      description:
        "Mark a specific day's task as done or undo it. " +
        "Toggles the completion status and updates the last activity timestamp " +
        "(used by the nudge system to track inactivity).",
      inputSchema: {
        type: "object",
        properties: {
          roadmapId: { type: "string", description: "Convex document ID for the roadmap" },
          dayNumber: { type: "number", description: "Day number (1-30) to toggle" },
        },
        required: ["roadmapId", "dayNumber"],
      },
    },

    // ─── Manual Context ─────────────────────────────────────────
    {
      name: "update_manual_context",
      description:
        "Update the manual business context/notes on a roadmap. " +
        "This information is used by Agent Karya to personalize strategy " +
        "(e.g. 'We have a 50% off sale this weekend', 'New product arrived').",
      inputSchema: {
        type: "object",
        properties: {
          roadmapId: { type: "string", description: "Convex document ID for the roadmap" },
          text:      { type: "string", description: "Manual context text to save" },
        },
        required: ["roadmapId", "text"],
      },
    },

    // ─── Agent Karya: Strategy ──────────────────────────────────
    {
      name: "generate_karya_strategy",
      description:
        "Run Agent Karya to generate a tactical marketing strategy for a specific day. " +
        "Uses Llama 3.3 70B via HuggingFace to create step-by-step execution guides, " +
        "reel scripts, captions, and visual prompts in Hinglish. " +
        "Requires the Next.js dev server to be running.",
      inputSchema: {
        type: "object",
        properties: {
          brandName:     { type: "string", description: "Business name" },
          location:      { type: "string", description: "Business location/city" },
          category:      { type: "string", description: "Business category" },
          aiContext:     { type: "string", description: "AI Vision context from business photos" },
          manualContext: { type: "string", description: "Manual business notes (sales, events, etc.)" },
          dayTask:       { type: "string", description: "Today's task label from the roadmap" },
          currentDay:    { type: "number", description: "Current day number (1-30)" },
          roadmapData:   {
            type: "array",
            description: "Array of day objects from the 30-day plan (optional, provides full context)",
            items: { type: "object" },
          },
        },
        required: ["brandName", "location", "dayTask", "currentDay"],
      },
    },

    // ─── Agent Karya: Poster ────────────────────────────────────
    {
      name: "generate_poster",
      description:
        "Generate a marketing poster image using FLUX.1 via HuggingFace. " +
        "Returns a 1024×1024 image as base64. " +
        "Requires the Next.js dev server to be running.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Stable Diffusion / FLUX prompt for the poster" },
        },
        required: ["prompt"],
      },
    },

    // ─── Agent Karya: Reel ──────────────────────────────────────
    {
      name: "generate_reel",
      description:
        "Generate a vertical 9:16 reel/video poster using FLUX.1 via HuggingFace. " +
        "Returns a 720×1280 cinematic vertical image as base64. " +
        "Requires the Next.js dev server to be running.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Prompt for the vertical reel image (cinematic style is auto-appended)" },
        },
        required: ["prompt"],
      },
    },


    // ─── Chat with MOM ──────────────────────────────────────────
    {
      name: "chat_with_mom",
      description:
        "Chat with the MOM marketing concierge (Gemini-powered). " +
        "The AI mentor responds in Hinglish with specific marketing advice " +
        "based on the business's Vision context and roadmap data. " +
        "When roadmapId and userId are provided, messages are saved to conversation history. " +
        "Requires the Next.js dev server to be running.",
      inputSchema: {
        type: "object",
        properties: {
          message:    { type: "string", description: "User's message/question" },
          roadmapId:  { type: "string", description: "Convex roadmap ID (for context and history)" },
          userId:     { type: "string", description: "Clerk user ID" },
          shopName:   { type: "string", description: "Business name (fallback if no roadmap)" },
          city:       { type: "string", description: "City (fallback if no roadmap)" },
        },
        required: ["message"],
      },
    },

    // ─── User Profile ───────────────────────────────────────────
    {
      name: "get_user_profile",
      description:
        "Get a user's profile from Convex, including premium status, " +
        "integrations, and business links.",
      inputSchema: {
        type: "object",
        properties: {
          clerkId: { type: "string", description: "Clerk user ID" },
        },
        required: ["clerkId"],
      },
    },

    // ─── Chat History ───────────────────────────────────────────
    {
      name: "get_chat_history",
      description:
        "Get the full chat conversation history for a specific roadmap. " +
        "Returns all user and assistant messages in order.",
      inputSchema: {
        type: "object",
        properties: {
          roadmapId: { type: "string", description: "Convex roadmap ID" },
        },
        required: ["roadmapId"],
      },
    },
  ],
}));

// =====================================================================
//  TOOL IMPLEMENTATIONS
// =====================================================================
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, any>;

  try {
    switch (name) {

      // ────────────────────────────────────────────────────────
      //  generate_roadmap
      // ────────────────────────────────────────────────────────
      case "generate_roadmap": {
        await callApi("/api/generate", {
          shopName:       a.shopName,
          city:           a.city,
          address:        a.address ?? "",
          category:       a.category ?? "",
          monthlyRevenue: a.monthlyRevenue ?? "",
          whatsapp:       a.whatsapp ?? "",
          initialPrompt:  a.initialPrompt,
          userId:         a.userId,
        });

        // Fetch the newly created roadmap
        const latest = await convex.query(api.roadmaps.getLatest, {
          userId: a.userId,
        });

        if (!latest) {
          return text("✅ Roadmap generated and saved to Convex, but could not retrieve it immediately.");
        }

        const d = latest.data as any;
        return json(
          `✅ 30-Day Roadmap created for "${latest.brandName}" in ${latest.location}`,
          {
            roadmapId: latest._id,
            brand: d.brand,
            marketingDNA: d.marketingDNA,
            weeklyThemes: d.weeklyThemes,
            dayCount: d.thirtyDayPlan?.length ?? 0,
            budgetPlan: d.budgetPlan,
          },
        );
      }

      // ────────────────────────────────────────────────────────
      //  list_roadmaps
      // ────────────────────────────────────────────────────────
      case "list_roadmaps": {
        const roadmaps = await convex.query(api.roadmaps.listMyRoadmaps, {
          userId: a.userId,
        });

        const summary = roadmaps.map((r: any) => ({
          id: r._id,
          brandName: r.brandName,
          location: r.location,
          category: r.category,
          createdAt: new Date(r.createdAt).toISOString(),
          completedDays: r.completedDays?.length ?? 0,
        }));

        return json(`Found ${summary.length} roadmap(s)`, summary);
      }

      // ────────────────────────────────────────────────────────
      //  get_roadmap
      // ────────────────────────────────────────────────────────
      case "get_roadmap": {
        const roadmap = await convex.query(api.roadmaps.getRoadmap, {
          roadmapId: a.roadmapId,
        });

        if (!roadmap) return text("Roadmap not found.");

        return json(`Roadmap: ${roadmap.brandName}`, {
          id: roadmap._id,
          brandName: roadmap.brandName,
          location: roadmap.location,
          category: roadmap.category,
          completedDays: roadmap.completedDays ?? [],
          lastActivityAt: roadmap.lastActivityAt
            ? new Date(roadmap.lastActivityAt).toISOString()
            : null,
          manualContext: roadmap.manualContext ?? null,
          hasVisionVault: !!(roadmap as any).businessVault?.aiContext,
          data: roadmap.data,
        });
      }

      // ────────────────────────────────────────────────────────
      //  get_latest_roadmap
      // ────────────────────────────────────────────────────────
      case "get_latest_roadmap": {
        const latest = await convex.query(api.roadmaps.getLatest, {
          userId: a.userId,
        });

        if (!latest) return text("No roadmaps found for this user.");

        return json(`Latest roadmap: ${latest.brandName}`, {
          id: latest._id,
          brandName: latest.brandName,
          location: latest.location,
          category: latest.category,
          completedDays: latest.completedDays ?? [],
          data: latest.data,
        });
      }

      // ────────────────────────────────────────────────────────
      //  toggle_task_completion
      // ────────────────────────────────────────────────────────
      case "toggle_task_completion": {
        await convex.mutation(api.roadmaps.toggleTaskCompletion, {
          roadmapId: a.roadmapId,
          dayNumber: a.dayNumber,
        });

        // Re-fetch to confirm
        const updated = await convex.query(api.roadmaps.getRoadmap, {
          roadmapId: a.roadmapId,
        });
        const days = (updated as any)?.completedDays ?? [];
        const isDone = days.includes(a.dayNumber);

        return text(
          isDone
            ? `✅ Day ${a.dayNumber} marked as DONE! (${days.length}/30 completed)`
            : `⬜ Day ${a.dayNumber} marked as NOT DONE. (${days.length}/30 completed)`,
        );
      }

      // ────────────────────────────────────────────────────────
      //  update_manual_context
      // ────────────────────────────────────────────────────────
      case "update_manual_context": {
        await convex.mutation(api.roadmaps.updateManualContext, {
          roadmapId: a.roadmapId,
          text: a.text,
        });
        return text(`✅ Manual context updated for roadmap ${a.roadmapId}`);
      }

      // ────────────────────────────────────────────────────────
      //  generate_karya_strategy
      // ────────────────────────────────────────────────────────
      case "generate_karya_strategy": {
        const result = await callApi("/api/karya/generate", {
          brandName:     a.brandName,
          location:      a.location,
          category:      a.category ?? "",
          aiContext:     a.aiContext ?? "",
          manualContext: a.manualContext ?? "",
          dayTask:       a.dayTask,
          currentDay:    a.currentDay,
          roadmapData:   a.roadmapData ?? [],
        });

        return json(`Agent Karya Strategy — Day ${a.currentDay} (${result.type})`, {
          type: result.type,
          report: result.report,
          imagePrompt: result.imagePrompt,
          videoPrompt: result.videoPrompt,
        });
      }

      // ────────────────────────────────────────────────────────
      //  generate_poster
      // ────────────────────────────────────────────────────────
      case "generate_poster": {
        const result = await callApi("/api/karya/generate/image", {
          prompt: a.prompt,
        });

        if (result.error) throw new Error(result.error);

        // Return as MCP image content
        const base64 = (result.imageUrl as string).replace(
          /^data:image\/\w+;base64,/,
          "",
        );

        return {
          content: [
            { type: "image" as const, data: base64, mimeType: "image/webp" },
            { type: "text" as const, text: `✅ Poster generated (1024×1024) for prompt: "${a.prompt}"` },
          ],
        };
      }

      // ────────────────────────────────────────────────────────
      //  generate_reel
      // ────────────────────────────────────────────────────────
      case "generate_reel": {
        const result = await callApi("/api/karya/generate/video", {
          prompt: a.prompt,
        });

        if (result.error) throw new Error(result.error);

        const base64 = (result.videoUrl as string).replace(
          /^data:image\/\w+;base64,/,
          "",
        );

        return {
          content: [
            { type: "image" as const, data: base64, mimeType: "image/webp" },
            { type: "text" as const, text: `✅ Vertical reel image generated (720×1280) for prompt: "${a.prompt}"` },
          ],
        };
      }


      // ────────────────────────────────────────────────────────
      //  chat_with_mom
      // ────────────────────────────────────────────────────────
      case "chat_with_mom": {
        // Save user message to Convex if we have context
        if (a.roadmapId && a.userId) {
          await convex.mutation(api.messages.send, {
            roadmapId: a.roadmapId,
            userId: a.userId,
            content: a.message,
            role: "user",
          });
        }

        // Call the chat API (saves assistant response to Convex)
        await callApi("/api/chat", {
          message: a.message,
          roadmapId: a.roadmapId ?? null,
          userId: a.userId ?? null,
          businessData: {
            shopName: a.shopName ?? "",
            city: a.city ?? "",
          },
        });

        // Retrieve the assistant's response from Convex
        if (a.roadmapId) {
          const messages = await convex.query(api.messages.list, {
            roadmapId: a.roadmapId,
          });

          const lastAssistant = [...messages]
            .reverse()
            .find((m: any) => m.role === "assistant");

          if (lastAssistant) {
            return text((lastAssistant as any).content);
          }
        }

        return text("✅ MOM responded. Provide a roadmapId to see the full response.");
      }

      // ────────────────────────────────────────────────────────
      //  get_user_profile
      // ────────────────────────────────────────────────────────
      case "get_user_profile": {
        const user = await convex.query(api.users.getUser, {
          clerkId: a.clerkId,
        });

        if (!user) return text("User not found.");

        return json(`User: ${(user as any).name}`, {
          id: (user as any)._id,
          name: (user as any).name,
          email: (user as any).email,
          isPremium: (user as any).isPremium,
          integrations: (user as any).integrations,
          businessLinks: (user as any).businessLinks,
        });
      }

      // ────────────────────────────────────────────────────────
      //  get_chat_history
      // ────────────────────────────────────────────────────────
      case "get_chat_history": {
        const messages = await convex.query(api.messages.list, {
          roadmapId: a.roadmapId,
        });

        const formatted = (messages as any[]).map((m) => ({
          role: m.role,
          content: m.content,
          time: new Date(m.createdAt).toISOString(),
        }));

        return json(`Chat history — ${formatted.length} message(s)`, formatted);
      }

      // ────────────────────────────────────────────────────────
      default:
        return text(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(err);
  }
});

// ── Bootstrap ─────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 MOM MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
