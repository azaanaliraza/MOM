import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.optional(v.string()), 
    tokenIdentifier: v.optional(v.string()), // Maintain compatibility for older users
    isPremium: v.optional(v.boolean()), // 🆕 Track premium status
  }).index("by_clerkId", ["clerkId"]).index("by_token", ["tokenIdentifier"]),

  roadmaps: defineTable({
    userId: v.string(), // This will be the clerkId (or Clerk token identifier)
    brandName: v.string(),
    location: v.string(),
    address: v.optional(v.string()),
    category: v.optional(v.string()),
    monthlyRevenue: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    data: v.any(), 
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
  
  messages: defineTable({
    roadmapId: v.id("roadmaps"),
    userId: v.string(), // This will be the clerkId
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_roadmap", ["roadmapId"]),
});