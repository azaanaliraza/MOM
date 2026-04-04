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
      // Look up the user's data via the users table
      const user: any = await ctx.runQuery(internal.crons.getUserEmail, {
        clerkId: userId,
      });

      if (user?.email && user.email !== "pending-sync") {
        await ctx.runAction(internal.email.sendNudgeEmail, {
          email: user.email,
          brandName,
        });
      }

      if (user?.phoneNumber) {
        await ctx.runAction(internal.whatsapp.sendWhatsAppNudge, {
          phoneNumber: user.phoneNumber,
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

// Helper query to get all roadmaps
export const getAllRoadmapsData = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roadmaps").collect();
  },
});

// Action for 8 AM (IST) Morning Task Push
export const pushMorningTasks = internalAction({
  args: {},
  handler: async (ctx) => {
    const roadmaps: any = await ctx.runQuery(internal.crons.getAllRoadmapsData, {});

    for (const roadmap of roadmaps) {
      if (!roadmap.data?.thirtyDayPlan) continue;
      
      // Look up user's phone number
      const user: any = await ctx.runQuery(internal.crons.getUserEmail, { clerkId: roadmap.userId });
      const phone = roadmap.whatsapp || user?.phoneNumber;
      
      if (!phone) continue;

      // Calculate Current Day (Day 1 starts on createdAt)
      const daysSinceCreation = Math.floor((Date.now() - roadmap.createdAt) / (1000 * 60 * 60 * 24));
      const currentDayNumber = daysSinceCreation + 1;

      // Find the specific task for today out of the 30-day plan
      const todaysTask = roadmap.data.thirtyDayPlan.find((d: any) => d.day === currentDayNumber);
      
      if (todaysTask) {
        await ctx.runAction(internal.whatsapp.sendDailyTask, {
          phoneNumber: phone,
          brandName: roadmap.brandName,
          currentDay: currentDayNumber,
          taskTitle: todaysTask.label
        });
      }
    }
  },
});

// Action for 8 PM (IST) Evening Incompletion Reminder
export const pushEveningReminders = internalAction({
  args: {},
  handler: async (ctx) => {
    const roadmaps: any = await ctx.runQuery(internal.crons.getAllRoadmapsData, {});

    for (const roadmap of roadmaps) {
      if (!roadmap.data?.thirtyDayPlan) continue;
      
      const user: any = await ctx.runQuery(internal.crons.getUserEmail, { clerkId: roadmap.userId });
      const phone = roadmap.whatsapp || user?.phoneNumber;
      
      if (!phone) continue;

      const daysSinceCreation = Math.floor((Date.now() - roadmap.createdAt) / (1000 * 60 * 60 * 24));
      const currentDayNumber = daysSinceCreation + 1;
      
      // Check if they completed today's task
      const isDone = roadmap.completedDays?.includes(currentDayNumber);
      if (isDone) continue; // If done, skip!

      const todaysTask = roadmap.data.thirtyDayPlan.find((d: any) => d.day === currentDayNumber);
      
      if (todaysTask) {
        await ctx.runAction(internal.whatsapp.sendIncompleteReminder, {
          phoneNumber: phone,
          brandName: roadmap.brandName,
          currentDay: currentDayNumber,
          taskTitle: todaysTask.label
        });
      }
    }
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

// Run Morning Tasks at 8:00 AM IST (which is 2:30 AM UTC)
crons.daily(
  "morning whatsapp task push",
  { hourUTC: 2, minuteUTC: 30 },
  internal.crons.pushMorningTasks,
  {}
);

// Run Evening Reminders at 8:00 PM IST (which is 14:30 PM UTC)
crons.daily(
  "evening whatsapp task reminder",
  { hourUTC: 14, minuteUTC: 30 },
  internal.crons.pushEveningReminders,
  {}
);

export default crons;
