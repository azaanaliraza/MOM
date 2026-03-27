import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
  args: { 
    clerkId: v.string(), 
    name: v.string(), 
    email: v.string(),
    pictureUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user !== null) {
      // 2. If user exists, update their details if they changed
      if (
        user.name !== args.name || 
        user.email !== args.email || 
        user.pictureUrl !== args.pictureUrl ||
        user.phoneNumber !== args.phoneNumber
      ) {
        await ctx.db.patch(user._id, { 
          name: args.name, 
          email: args.email,
          pictureUrl: args.pictureUrl ?? user.pictureUrl,
          phoneNumber: args.phoneNumber ?? user.phoneNumber,
        });
      }
      return user._id;
    }

    // 3. If new user, create them with real data
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      pictureUrl: args.pictureUrl,
      phoneNumber: args.phoneNumber,
      isPremium: false,
      integrations: {
        googleBusiness: false,
        instagram: false,
        whatsapp: ""
      },
    });
  },
});

// Removed updateBusinessVault from users as it now belongs to roadmaps logic

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const updateAgentMemory = mutation({
  args: { 
    roadmapId: v.id("roadmaps"), 
    intelligence: v.string(),
    storageId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    const oldContext = roadmap.businessVault?.aiContext || "";
    const newContext = `${oldContext}\n\n[New Intelligence]:\n${args.intelligence}`;

    const currentImages = roadmap.businessVault?.images || [];
    const newImages = args.storageId ? [...currentImages, args.storageId] : currentImages;

    await ctx.db.patch(args.roadmapId, {
      businessVault: {
        images: newImages,
        aiContext: newContext,
      }
    });

    return { success: true };
  },
});
