"use node";

import { internalAction, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { ComposioToolSet } from "composio-core";

// Action for 8 AM (IST) Morning Task Push
export const pushMorningTasks = internalAction({
  args: {},
  handler: async (ctx) => {
    const roadmaps: any = await ctx.runQuery(internal.crons.getAllRoadmapsData, {});
    const composio = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY! });

    for (const roadmap of roadmaps) {
      try {
        if (!roadmap.data) continue;

        const user: any = await ctx.runQuery(internal.crons.getUserEmail, { clerkId: roadmap.userId });
        const phone = roadmap.whatsapp || user?.phoneNumber;

        if (!phone) {
          console.warn(`[MorningTask] No phone found for roadmap ${roadmap._id}`);
          continue;
        }

        const plan = roadmap.data.thirtyDayPlan || roadmap.data.roadmap || [];
        const daysSinceCreation = Math.floor((Date.now() - (roadmap.createdAt || Date.now())) / (1000 * 60 * 60 * 24));
        const currentDayNumber = daysSinceCreation + 1;

        const todaysTask = plan.find((d: any) => {
          const d_day = Number(String(d.day).match(/\d+/));
          return d_day === currentDayNumber;
        });

        if (todaysTask) {
          console.log(`[MorningTask] Processing Day ${currentDayNumber} for ${roadmap.brandName} (${phone})`);

          let approvalMsg = "";
          try {
            const entity = await composio.getEntity(roadmap.userId);
            const connections = await entity.getConnections();
            const isInstaConnected = connections.some(c => c.appName === "instagram");
            const isGMBConnected = connections.some(c => c.appName === "googlebusinessprofile");

            if (isInstaConnected || isGMBConnected) {
              const aiContent: any = await ctx.runAction(internal.agent.generateTaskContent, {
                prompt: todaysTask.label,
                businessContext: `Name: ${roadmap.brandName}, Location: ${roadmap.location}, Category: ${roadmap.category}`
              });

              if (isInstaConnected) {
                await ctx.runMutation(api.roadmaps.addPendingApproval, {
                  roadmapId: roadmap._id,
                  item: { id: Math.random().toString(36).substr(2, 9), type: "instagram_reel", content: aiContent.reel_script || aiContent.instagram_caption, createdAt: Date.now() }
                });
                approvalMsg += `\n\n📸 *Instagram Reel Ready*\nScript: ${aiContent.reel_script?.substring(0, 50)}...\n👉 Approve: ${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?tab=connect`;
              }

              if (isGMBConnected) {
                await ctx.runMutation(api.roadmaps.addPendingApproval, {
                  roadmapId: roadmap._id,
                  item: { id: Math.random().toString(36).substr(2, 9), type: "gmb_post", content: aiContent.gmb_post, createdAt: Date.now() }
                });
                approvalMsg += `\n\n📍 *GMB Update Ready*\nPost: ${aiContent.gmb_post?.substring(0, 50)}...`;
              }
            }
          } catch (compErr) {
            console.error(`[MorningTask] Composio/AI error for ${roadmap.userId}:`, compErr);
          }

          await ctx.runAction(internal.whatsapp.sendDailyTask, {
            phoneNumber: phone,
            brandName: roadmap.brandName,
            currentDay: currentDayNumber,
            taskTitle: todaysTask.label + approvalMsg
          });
        }
      } catch (err) {
        console.error(`[MorningTask] Fatal error processing roadmap ${roadmap._id}:`, err);
      }
    }
  },
});
