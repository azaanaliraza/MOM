import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Query to find users inactive for more than 3 days
export const findInactiveUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

    // Get all roadmaps and check activity timestamp
    const allRoadmaps = await ctx.db.query("roadmaps").take(200);

    const inactiveRoadmaps: Array<{ userId: string; brandName: string }> = [];

    for (const roadmap of allRoadmaps) {
      // If the user has never been active or was last active more than 3 days ago
      const lastActivity = roadmap.lastActivityAt || roadmap.createdAt;
      if (lastActivity < threeDaysAgo) {
        inactiveRoadmaps.push({
          userId: roadmap.userId,
          brandName: roadmap.brandName,
        });
      }
    }

    // Deduplicate by userId (only nudge once per user)
    const seen = new Set<string>();
    return inactiveRoadmaps.filter((r) => {
      if (seen.has(r.userId)) return false;
      seen.add(r.userId);
      return true;
    });
  },
});

// Action that finds inactive users and sends them nudge emails
export const checkAndNudge = internalAction({
  args: {},
  handler: async (ctx) => {
    const inactiveUsers: Array<{ userId: string; brandName: string }> =
      await ctx.runQuery(internal.crons.findInactiveUsers, {});

    for (const { userId, brandName } of inactiveUsers) {
      // Look up the user's email via the users table
      const user: any = await ctx.runQuery(internal.crons.getUserEmail, {
        clerkId: userId,
      });

      if (user?.email && user.email !== "pending-sync") {
        await ctx.runAction(internal.email.sendNudgeEmail, {
          email: user.email,
          brandName,
        });
      }
    }
  },
});

// Helper query to get user email by clerkId
export const getUserEmail = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

const crons = cronJobs();

// Run the inactivity check every 24 hours
crons.interval(
  "daily inactivity nudge",
  { hours: 24 },
  internal.crons.checkAndNudge,
  {}
);

export default crons;
