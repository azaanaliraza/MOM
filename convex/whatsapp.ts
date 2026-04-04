"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import twilio from "twilio";
import { ComposioToolSet } from "composio-core";

export const postToSocial = action({
  args: {
    clerkId: v.string(),
    platform: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const composio = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY! });

    await composio.executeAction({
      action: args.platform === "instagram" ? "INSTAGRAM_POST" : "GOOGLEBUSINESSPROFILE_CREATE_POST",
      params: {
        text: args.content,
        media_url: args.imageUrl
      },
      entityId: args.clerkId
    });
  }
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
    phoneNumber: v.string(), // E.164 format: +91XXXXXXXXXX
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
