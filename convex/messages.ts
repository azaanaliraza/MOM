import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_roadmap", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();
  },
});

export const send = mutation({
  args: { roadmapId: v.id("roadmaps"), content: v.string(), role: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      roadmapId: args.roadmapId,
      userId: args.userId,
      content: args.content,
      role: args.role as "user" | "assistant",
      createdAt: Date.now(),
    });
  },
});
