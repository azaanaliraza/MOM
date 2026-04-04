import { cronJobs } from "convex/server";
import { internal, api } from "./_generated/api";
import { internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Query to find users inactive for more than 3 days
export const findInactiveUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const allRoadmaps = await ctx.db.query("roadmaps").take(200);
    const inactiveRoadmaps: Array<{ userId: string; brandName: string }> = [];

    for (const roadmap of allRoadmaps) {
      const lastActivity = roadmap.lastActivityAt || roadmap.createdAt;
      if (lastActivity < threeDaysAgo) {
        inactiveRoadmaps.push({
          userId: roadmap.userId,
          brandName: roadmap.brandName,
        });
      }
    }

    const seen = new Set<string>();
    return inactiveRoadmaps.filter((r) => {
      if (seen.has(r.userId)) return false;
      seen.add(r.userId);
      return true;
    });
  },
});

export const checkAndNudge = internalAction({
  args: {},
  handler: async (ctx) => {
    const inactiveUsers: Array<{ userId: string; brandName: string }> =
      await ctx.runQuery(internal.crons.findInactiveUsers, {});

    for (const { userId, brandName } of inactiveUsers) {
      const user: any = await ctx.runQuery(internal.crons.getUserEmail, {
        clerkId: userId,
      });

      if (user?.email && user.email !== "pending-sync") {
        await ctx.runAction(internal.email.sendNudgeEmail, {
          email: user.email,
          brandName,
        });
      }

      const phone = user?.phoneNumber;
      if (phone) {
        await ctx.runAction(internal.whatsapp.sendWhatsAppNudge, {
          phoneNumber: phone,
          brandName,
        });
      }
    }
  },
});

export const getUserEmail = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getAllRoadmapsData = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roadmaps").collect();
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
      const isDone = roadmap.completedDays?.includes(currentDayNumber);
      if (isDone) continue;

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

crons.interval(
  "daily inactivity nudge",
  { hours: 24 },
  internal.crons.checkAndNudge,
  {}
);

crons.daily(
  "morning whatsapp task push",
  { hourUTC: 2, minuteUTC: 30 },
  internal.morningTasks.pushMorningTasks,
  {}
);

crons.daily(
  "evening whatsapp task reminder",
  { hourUTC: 14, minuteUTC: 30 },
  internal.crons.pushEveningReminders,
  {}
);

export default crons;
