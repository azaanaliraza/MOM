"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import twilio from "twilio";
import { ComposioToolSet } from "composio-core";

// Direct Composio REST API helper — bypasses the buggy SDK executeAction
async function composioExecute(actionName: string, params: Record<string, any>, entityId: string): Promise<any> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) throw new Error("COMPOSIO_API_KEY not set");

  const url = `https://backend.composio.dev/api/v2/actions/${actionName}/execute`;
  console.log(`[MOM] REST → ${actionName} entity=${entityId}`);

  // Extract app name from action (e.g. INSTAGRAM_CREATE_POST → instagram)
  const appName = actionName.split("_")[0].toLowerCase();

  const requestBody = {
    entityId,
    appName,
    input: params,
  };
  console.log(`[MOM] REST → ${actionName} entity=${entityId} body=${JSON.stringify(requestBody)}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  const body = await res.text();
  console.log(`[MOM] REST ← ${res.status} ${body.substring(0, 500)}`);

  if (!res.ok) {
    throw new Error(`Composio API ${res.status}: ${body.substring(0, 300)}`);
  }

  try { return JSON.parse(body); } catch { return body; }
}

export const postToSocial = action({
  args: {
    clerkId: v.string(),
    platform: v.string(),
    content: v.string(),
    storageId: v.optional(v.string()),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let publicUrl = args.imageUrl;
    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId);
      if (url) publicUrl = url;
    }

    if (args.platform === "instagram") {
      // Step 1: Create Media Container
      const container = await composioExecute(
        "INSTAGRAM_CREATE_MEDIA_CONTAINER",
        { ig_user_id: "me", caption: args.content, image_url: publicUrl },
        args.clerkId
      );

      const creationId = container?.data?.id;
      if (!creationId) {
        throw new Error(`Container creation failed: ${JSON.stringify(container).substring(0, 300)}`);
      }

      // Step 2: Wait for media to be ready (Instagram needs processing time)
      console.log(`[MOM] Waiting for container ${creationId} to be ready...`);
      let ready = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(r => setTimeout(r, 3000)); // wait 3s between checks
        try {
          const status = await composioExecute(
            "INSTAGRAM_GET_POST_STATUS",
            { ig_user_id: "me", creation_id: creationId },
            args.clerkId
          );
          const statusCode = status?.data?.status_code || status?.data?.status;
          console.log(`[MOM] Container status (attempt ${attempt + 1}): ${statusCode}`);
          if (statusCode === "FINISHED" || statusCode === "finished") {
            ready = true;
            break;
          }
          if (statusCode === "ERROR" || statusCode === "error") {
            throw new Error(`Instagram media processing failed: ${JSON.stringify(status?.data).substring(0, 300)}`);
          }
        } catch (e: any) {
          // Status check might 404 — just keep waiting
          console.log(`[MOM] Status check attempt ${attempt + 1} error: ${e.message?.substring(0, 100)}`);
        }
      }

      if (!ready) {
        // Try publishing anyway after 30s — it might work
        console.log("[MOM] Container not confirmed ready, attempting publish anyway...");
      }

      // Step 3: Publish
      const publishResult = await composioExecute(
        "INSTAGRAM_CREATE_POST",
        { ig_user_id: "me", creation_id: creationId },
        args.clerkId
      );

      // Check if publish had an error in the response body
      if (publishResult?.data?.message?.includes("not available") || publishResult?.data?.message?.includes("not ready")) {
        throw new Error("Instagram media still processing. Please try again in a few seconds.");
      }

      return { success: true, postId: publishResult?.data?.id };

    } else if (args.platform === "googlebusinessprofile") {
      const result = await composioExecute(
        "GOOGLEBUSINESSPROFILE_CREATE_POST",
        {
          summary: args.content,
          ...(publicUrl ? { media: [{ sourceUrl: publicUrl, mediaFormat: "PHOTO" }] } : {})
        },
        args.clerkId
      );
      return { success: true };

    } else {
      throw new Error(`Unsupported platform: ${args.platform}`);
    }
  }
});

export const persistUrlToStorage = action({
  args: { url: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch(args.url);
    const blob = await response.blob();
    return await ctx.storage.store(blob);
  },
});

export const uploadBase64ToStorage = action({
  args: { base64Data: v.string() },
  handler: async (ctx, args) => {
    // Strip the data URL prefix (e.g. "data:image/webp;base64,")
    const matches = args.base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid base64 data URL");
    
    const mimeType = matches[1];
    const rawBase64 = matches[2];
    const buffer = Buffer.from(rawBase64, "base64");
    const blob = new Blob([buffer], { type: mimeType });
    
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    if (!url) throw new Error("Failed to get storage URL");
    
    return { storageId, url };
  },
});

export const testCloud = action({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.whatsapp.sendWelcomeMessage, {
      phoneNumber: args.phoneNumber,
      brandName: "TEST DASHBOARD",
    });
  },
});


export const sendWhatsAppNudge = internalAction({
  args: {
    phoneNumber: v.string(),
    brandName: v.string()
  },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const rawFrom = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
    const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom}`;
    const to = `whatsapp:${args.phoneNumber.startsWith('+') ? args.phoneNumber : '+91' + args.phoneNumber}`;

    if (!accountSid || !authToken) return;
    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      console.log(`[WhatsApp] Sending nudge from ${from} to ${to}`);
      await client.messages.create({ from, to, body: `Oye! 👋 Aapne kuch dino se ${args.brandName} ka marketing task nahi kiya. Aaj ka task check karo: ${siteUrl}/dashboard` });
    } catch (error) {
      console.error("WhatsApp error (sendWhatsAppNudge):", error);
    }
  },
});

export const sendDailyTask = internalAction({
  args: { phoneNumber: v.string(), brandName: v.string(), currentDay: v.number(), taskTitle: v.string() },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const rawFrom = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
    const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom}`;
    const to = `whatsapp:${args.phoneNumber.startsWith('+') ? args.phoneNumber : '+91' + args.phoneNumber}`;

    if (!accountSid || !authToken) return;
    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      console.log(`[WhatsApp] Sending daily task from ${from} to ${to}`);
      await client.messages.create({ from, to, body: `*Good Morning!* ☀️\n\n${args.brandName} ke liye aaj ki marketing tip (Day ${args.currentDay}):\n\n🎯 *${args.taskTitle}*\n\nAaj ye task complete karein aur dukan badhayein! Check dashboard: ${siteUrl}/dashboard` });
    } catch (error) {
      console.error("WhatsApp error (sendDailyTask):", error);
    }
  },
});

export const sendIncompleteReminder = internalAction({
  args: { phoneNumber: v.string(), brandName: v.string(), currentDay: v.number(), taskTitle: v.string() },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const rawFrom = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
    const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom}`;
    const to = `whatsapp:${args.phoneNumber.startsWith('+') ? args.phoneNumber : '+91' + args.phoneNumber}`;

    if (!accountSid || !authToken) return;
    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      console.log(`[WhatsApp] Sending reminder from ${from} to ${to}`);
      await client.messages.create({ from, to, body: `*Oye!* ⏰\n\nAapne aaj ka ${args.brandName} ka marketing task abhi tak mark 'Done' nahi kiya!\n\n🎯 *${args.taskTitle}*\n\nKaam poora karein aur MOM engine pe update karein: ${siteUrl}/dashboard` });
    } catch (error) {
      console.error("WhatsApp error (sendIncompleteReminder):", error);
    }
  },
});

export const sendWelcomeMessage = internalAction({
  args: { phoneNumber: v.string(), brandName: v.string() },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const rawFrom = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
    const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom}`;
    const to = `whatsapp:${args.phoneNumber.startsWith('+') ? args.phoneNumber : '+91' + args.phoneNumber}`;

    if (!accountSid || !authToken) return;
    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      console.log(`[WhatsApp] Sending welcome from ${from} to ${to}`);
      await client.messages.create({ from, to, body: `🎉 *Welcome to MOM, ${args.brandName}!* 🎉\n\nMai hoon aapka naya marketing brain 🧠. Aapka 30-day growth roadmap taiyaar ho gaya hai! \n\nAaj se har roz mai aapko direct yaha message karke aapka daily task samjhaunga. \n\nCheck your full roadmap here: ${siteUrl}/dashboard` });
    } catch (error) {
      console.error("WhatsApp error (sendWelcomeMessage):", error);
    }
  },
});

export const getConnectedPlatforms = action({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const composio = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY! });
    const entity = await composio.getEntity(args.clerkId);
    const connections = await entity.getConnections();
    return connections.filter(c => c.status === "ACTIVE").map(c => c.appName.toLowerCase());
  }
});
