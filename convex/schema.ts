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
    // 🆕 Vision Vault is now specific to THIS roadmap/business
    businessVault: v.optional(v.object({
      images: v.array(v.string()), // Storage IDs of uploaded photos for this business
      aiContext: v.string(),       // The specific memory for this business
    })),
    // 🆕 Manual context provided by the user (sale info, special notes etc.)
    manualContext: v.optional(v.string()),
    data: v.any(), 
    createdAt: v.number(),
    completedDays: v.optional(v.array(v.number())),
    lastActivityAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
  
  messages: defineTable({
    roadmapId: v.id("roadmaps"),
    userId: v.string(), // This will be the clerkId
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_roadmap", ["roadmapId"]),
});