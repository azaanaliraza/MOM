import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Check if user exists by clerkId (new index)
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      // Fallback: check by tokenIdentifier (old index)
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    if (user !== null) {
      // Patch missing fields for existing users (backfilling email/name)
      if (!user.clerkId || !user.email || user.email === "no-email" || !user.integrations) {
        await ctx.db.patch(user._id, {
          clerkId: identity.subject,
          email: identity.email ?? user.email,
          name: identity.name ?? user.name,
          isPremium: user.isPremium ?? false,
          integrations: user.integrations ?? { 
            googleBusiness: false, 
            instagram: false, 
            whatsapp: "" 
          }
        });
      }
      return user._id;
    }

    // If new user, create them as "Free"
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "no-email",
      clerkId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
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
