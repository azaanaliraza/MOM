import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const debugGetAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roadmaps").order("desc").take(5);
  }
});

export const createRoadmap = mutation({
  args: {
    userId: v.string(), // This is the Clerk ID
    brandName: v.string(),
    location: v.string(),
    address: v.optional(v.string()),
    category: v.optional(v.string()),
    monthlyRevenue: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    businessLinks: v.optional(v.array(v.string())), // 🆕 Added to fix schema validation
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // 1. Check if the user exists in our 'users' table
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();

    // 2. 🔥 UPSERT: If user doesn't exist, create them now!
    if (!user) {
      const identity = await ctx.auth.getUserIdentity();
      await ctx.db.insert("users", {
        clerkId: args.userId,
        name: identity?.name ?? "MOM User",
        email: identity?.email ?? "pending-sync",
        pictureUrl: identity?.pictureUrl,
        phoneNumber: identity?.phoneNumber,
        isPremium: false, // Default for new users
        integrations: {}, // Requirement for new schema
      });
    }

    // 3. ENFORCE LIMITS (Check existing roadmaps for this user)
    const existingRoadmaps = await ctx.db
      .query("roadmaps")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Check premium status (re-fetch user if just created or updated)
    user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.userId))
      .unique();
      
    const limit = user?.isPremium ? 100 : 3;

    if (existingRoadmaps.length >= limit) {
      throw new Error(`Limit reached. Free users can only generate ${limit} roadmaps.`);
    }

    // 4. SAVE THE ROADMAP
    const roadmapId = await ctx.db.insert("roadmaps", {
      userId: args.userId,
      brandName: args.brandName,
      location: args.location,
      address: args.address,
      category: args.category,
      monthlyRevenue: args.monthlyRevenue,
      whatsapp: args.whatsapp,
      businessLinks: args.businessLinks,
      data: args.data,
      createdAt: Date.now(),
    });

    // 5. SEND WELCOME WHATSAPP MESSAGE
    if (args.whatsapp) {
      await ctx.scheduler.runAfter(0, internal.whatsapp.sendWelcomeMessage, {
        phoneNumber: args.whatsapp,
        brandName: args.brandName
      });
    }

    return roadmapId;
  },
});

// Query to list all roadmaps for the switcher
export const listMyRoadmaps = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roadmaps")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getRoadmap = query({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roadmapId);
  },
});

// Fetch the latest roadmap for the dashboard
export const getLatest = query({
    args: { userId: v.optional(v.string()) }, // Clerk's tokenIdentifier
    handler: async (ctx, args) => {
        if (!args.userId) return null;

        return await ctx.db
            .query("roadmaps")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .order("desc")
            .first();
    },
});

export const updateManualContext = mutation({
  args: { roadmapId: v.id("roadmaps"), text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roadmapId, { 
      manualContext: args.text 
    });
  },
});

export const removeVaultImage = mutation({
  args: { roadmapId: v.id("roadmaps") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roadmapId, { 
      businessVault: undefined
    });
  },
});

export const toggleTaskCompletion = mutation({
  args: { roadmapId: v.id("roadmaps"), dayNumber: v.number() },
  handler: async (ctx, args) => {
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    const completedDays = roadmap.completedDays || [];
    const isDone = completedDays.includes(args.dayNumber);

    const nextCompleted = isDone 
      ? completedDays.filter((d: number) => d !== args.dayNumber)
      : [...completedDays, args.dayNumber];

    await ctx.db.patch(args.roadmapId, { 
      completedDays: nextCompleted,
      lastActivityAt: Date.now() 
    });
  },
});