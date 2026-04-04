import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    tokenIdentifier: v.optional(v.string()), 
    pictureUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    isPremium: v.boolean(), 
    // ⚠️ Deprecated: Use businessVault on roadmaps instead. Keeping temporarily for migration.
    businessVault: v.optional(v.object({
      images: v.array(v.string()), 
      aiContext: v.string(),       
    })),
    // 🆕 Store account-level integrations (WhatsApp, Instagram etc.)
    integrations: v.optional(v.object({
      whatsapp: v.optional(v.string()), // Phone ID or API Key
      googleBusiness: v.optional(v.boolean()), // Connection status
      instagram: v.optional(v.boolean()),
    })),
    // 🆕 Business Links (GMB, Swiggy, Zomato etc.)
    businessLinks: v.optional(v.array(v.string())),
  }).index("by_clerkId", ["clerkId"]).index("by_token", ["tokenIdentifier"]),

  roadmaps: defineTable({
    userId: v.string(), // This will be the clerkId
    brandName: v.string(),
    location: v.string(),
    address: v.optional(v.string()),
    category: v.optional(v.string()),
    monthlyRevenue: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    businessLinks: v.optional(v.array(v.string())),
    businessVault: v.optional(v.object({
      images: v.array(v.string()), 
      aiContext: v.string(),       
    })),
    manualContext: v.optional(v.string()),
    createdAt: v.number(),
    completedDays: v.optional(v.array(v.number())),
    lastActivityAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  roadmap_data: defineTable({
    roadmapId: v.id("roadmaps"),
    content: v.any(),
  }).index("by_roadmap_data", ["roadmapId"]),

  approvals: defineTable({
    roadmapId: v.id("roadmaps"),
    itemId: v.string(),
    type: v.union(v.literal("instagram_reel"), v.literal("instagram_post"), v.literal("gmb_post")),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_approvals_roadmap", ["roadmapId"]).index("by_itemId", ["itemId"]),

  karya_outputs: defineTable({
    roadmapId: v.id("roadmaps"),
    day: v.number(),
    type: v.string(), // "poster", "reel", "guide"
    posterUrl: v.optional(v.string()),
    reelUrl: v.optional(v.string()),
    posterStorageId: v.optional(v.string()),
    reelStorageId: v.optional(v.string()),
    imagePrompt: v.optional(v.string()),
    videoPrompt: v.optional(v.string()),
    genId: v.string(), // The specific generation ID
    createdAt: v.number(),
  }).index("by_karya_roadmap", ["roadmapId"]).index("by_genId", ["genId"]),

  karya_reports: defineTable({
    outputId: v.string(), // Links to karya_outputs.genId
    report: v.string(),
  }).index("by_output_id", ["outputId"]),
  
  messages: defineTable({
    roadmapId: v.id("roadmaps"),
    userId: v.string(), // This will be the clerkId
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_messages_roadmap", ["roadmapId"]),
});