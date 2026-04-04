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

    // 4. SAVE THE ROADMAP META
    const roadmapId = await ctx.db.insert("roadmaps", {
      userId: args.userId,
      brandName: args.brandName,
      location: args.location,
      address: args.address,
      category: args.category,
      monthlyRevenue: args.monthlyRevenue,
      whatsapp: args.whatsapp,
      businessLinks: args.businessLinks,
      createdAt: Date.now(),
    });

    // 🆕 Save the big data blob in a separate table
    await ctx.db.insert("roadmap_data", {
      roadmapId,
      content: args.data
    });

    // 5. SEND WELCOME & DAY 1 TASK WHATSAPP MESSAGE
    if (args.whatsapp) {
      await ctx.scheduler.runAfter(0, internal.whatsapp.sendWelcomeMessage, {
        phoneNumber: args.whatsapp,
        brandName: args.brandName
      });

      const plan = (args.data as any).thirtyDayPlan || (args.data as any).roadmap || [];
      const day1 = plan.find((d: any) => String(d.day).match(/\d+/)?.[0] === "1");

      if (day1) {
        await ctx.scheduler.runAfter(5000, internal.whatsapp.sendDailyTask, {
          phoneNumber: args.whatsapp,
          brandName: args.brandName,
          currentDay: 1,
          taskTitle: day1.label
        });
      }
    }

    return roadmapId;
  },
});

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
    const roadmap = await ctx.db.get(args.roadmapId);
    if (!roadmap) return null;
    
    // Fetch related data
    const dataDoc = await ctx.db
      .query("roadmap_data")
      .withIndex("by_roadmap_data", (q) => q.eq("roadmapId", args.roadmapId))
      .unique();
    
    const arrivals = await ctx.db
      .query("approvals")
      .withIndex("by_approvals_roadmap", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    const outputs = await ctx.db
      .query("karya_outputs")
      .withIndex("by_karya_roadmap", (q) => q.eq("roadmapId", args.roadmapId))
      .collect();

    // Fetch reports for each output to keep documents within 1MB limit
    const enrichedOutputs = [];
    for (const o of outputs) {
      const rep = await ctx.db.query("karya_reports").withIndex("by_output_id", q => q.eq("outputId", o.genId)).unique();
      enrichedOutputs.push({ ...o, report: rep?.report || "" });
    }

    return { 
      ...roadmap, 
      data: dataDoc?.content,
      pendingApprovals: arrivals.map(a => ({ id: a.itemId, type: a.type, content: a.content, imageUrl: a.imageUrl, createdAt: a.createdAt })),
      karyaOutputs: enrichedOutputs
    };
  },
});

export const getLatest = query({
    args: { userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        if (!args.userId) return null;

        const roadmap = await ctx.db
            .query("roadmaps")
            .withIndex("by_user", (q) => q.eq("userId", args.userId!))
            .order("desc")
            .first();
        
        if (!roadmap) return null;

        // Fetch related data for the dashboard
        const dataDoc = await ctx.db
          .query("roadmap_data")
          .withIndex("by_roadmap_data", (q) => q.eq("roadmapId", roadmap._id))
          .unique();

        const arrivals = await ctx.db
          .query("approvals")
          .withIndex("by_approvals_roadmap", (q) => q.eq("roadmapId", roadmap._id))
          .collect();

        const outputs = await ctx.db
          .query("karya_outputs")
          .withIndex("by_karya_roadmap", (q) => q.eq("roadmapId", roadmap._id))
          .collect();

        const enrichedOutputs = [];
        for (const o of outputs) {
            const rep = await ctx.db.query("karya_reports").withIndex("by_output_id", q => q.eq("outputId", o.genId)).unique();
            enrichedOutputs.push({ ...o, report: rep?.report || "" });
        }

        return { 
          ...roadmap, 
          data: dataDoc?.content,
          pendingApprovals: arrivals.map(a => ({ id: a.itemId, type: a.type, content: a.content, imageUrl: a.imageUrl, createdAt: a.createdAt })),
          karyaOutputs: enrichedOutputs
        };
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

export const addPendingApproval = mutation({
  args: { 
    roadmapId: v.id("roadmaps"), 
    item: v.object({
      id: v.string(),
      type: v.union(v.literal("instagram_reel"), v.literal("instagram_post"), v.literal("gmb_post")),
      content: v.string(),
      imageUrl: v.optional(v.string()),
      createdAt: v.number()
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("approvals", {
      roadmapId: args.roadmapId,
      itemId: args.item.id,
      type: args.item.type,
      content: args.item.content,
      imageUrl: args.item.imageUrl,
      createdAt: args.item.createdAt
    });
  },
});

export const clearPendingApproval = mutation({
  args: { roadmapId: v.id("roadmaps"), itemId: v.string() },
  handler: async (ctx, args) => {
    const arrival = await ctx.db
      .query("approvals")
      .withIndex("by_itemId", (q) => q.eq("itemId", args.itemId))
      .unique();
    if (arrival) await ctx.db.delete(arrival._id);
  },
});

export const saveKaryaOutput = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    output: v.object({
      genId: v.string(),
      day: v.number(),
      type: v.string(),
      report: v.string(),
      posterUrl: v.optional(v.string()),
      reelUrl: v.optional(v.string()),
      imagePrompt: v.optional(v.string()),
      videoPrompt: v.optional(v.string()),
      createdAt: v.number(),
    })
  },
  handler: async (ctx, args) => {
    // Replace if same day exists for this roadmap
    const existing = await ctx.db
      .query("karya_outputs")
      .withIndex("by_karya_roadmap", (q) => q.eq("roadmapId", args.roadmapId))
      .filter(q => q.eq(q.field("day"), args.output.day))
      .unique();

    if (existing) {
      // Find and remove existing report too
      const oldRep = await ctx.db.query("karya_reports").withIndex("by_output_id", q => q.eq("outputId", existing.genId)).unique();
      if (oldRep) await ctx.db.delete(oldRep._id);
      await ctx.db.delete(existing._id);
    }

    const { report, ...metadata } = args.output;
    await ctx.db.insert("karya_outputs", {
      roadmapId: args.roadmapId,
      ...metadata
    });

    await ctx.db.insert("karya_reports", {
      outputId: args.output.genId,
      report: report
    });
  },
});

export const updateKaryaAsset = mutation({
  args: {
    roadmapId: v.id("roadmaps"),
    outputId: v.string(),
    posterUrl: v.optional(v.string()),
    reelUrl: v.optional(v.string()),
    posterStorageId: v.optional(v.string()),
    reelStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("karya_outputs")
      .withIndex("by_genId", (q) => q.eq("genId", args.outputId))
      .unique();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.posterUrl !== undefined ? { posterUrl: args.posterUrl } : {}),
        ...(args.reelUrl !== undefined ? { reelUrl: args.reelUrl } : {}),
        ...(args.posterStorageId !== undefined ? { posterStorageId: args.posterStorageId } : {}),
        ...(args.reelStorageId !== undefined ? { reelStorageId: args.reelStorageId } : {}),
      });
    }
  },
});

export const testInjectApprovals = mutation({
  args: {},
  handler: async (ctx) => {
    const roadmaps = await ctx.db.query("roadmaps").order("desc").take(5);
    for (const r of roadmaps) {
      await ctx.db.insert("approvals", {
        roadmapId: r._id,
        itemId: "fake_insta_123",
        type: "instagram_reel",
        content: "🎥 Stop scrolling! Did you know our local coffee shop roasts beans right here in the store? Visit us today for a free pastry with any large latte! ✨☕",
        imageUrl: "https://image.pollinations.ai/prompt/Cinematic%20vertical%20shot%20of%20a%20modern%20coffee%20shop%20with%20latte%20art?width=1080&height=1920&nologo=true",
        createdAt: Date.now()
      });
      await ctx.db.insert("approvals", {
        roadmapId: r._id,
        itemId: "fake_gmb_123",
        type: "gmb_post",
        content: "📍 Exciting news! We just launched our new summer menu. Stop by this weekend to experience the best local treats in town. See you soon!",
        imageUrl: "https://image.pollinations.ai/prompt/Charming%20modern%20bakery%20storefront%20with%20pastries%20in%20the%20window%20warm%20sunlight?width=1024&height=1024&nologo=true",
        createdAt: Date.now()
      });
    }
  }
});

export const cleanupOldTableData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Clean roadmaps
    const roadmaps = await ctx.db.query("roadmaps").collect();
    let cleanedRoadmaps = 0;
    for (const r of roadmaps) {
      const roadmap = r as any;
      if (roadmap.data || roadmap.pendingApprovals || roadmap.karyaOutputs) {
        await ctx.db.patch(r._id, {
          // @ts-ignore
          data: undefined,
          // @ts-ignore
          pendingApprovals: undefined,
          // @ts-ignore
          karyaOutputs: undefined
        } as any);
        cleanedRoadmaps++;
      }
    }

    // 2. Clean karya_outputs
    const outputs = await ctx.db.query("karya_outputs").collect();
    let cleanedOutputs = 0;
    for (const o of outputs) {
      const output = o as any;
      if (output.report) {
        await ctx.db.patch(o._id, {
          // @ts-ignore
          report: undefined
        } as any);
        cleanedOutputs++;
      }
    }

    return `Cleaned up ${cleanedRoadmaps} roadmaps and ${cleanedOutputs} karya_outputs. Size reduction complete!`;
  }
});
