"use node";

import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import twilio from "twilio";

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
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Default Twilio Sandbox
    
    if (!accountSid || !authToken) {
      console.error("Twilio credentials missing");
      return;
    }

    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      const message = await client.messages.create({
        from: fromNumber,
        to: `whatsapp:${args.phoneNumber}`,
        body: `Oye! 👋 Aapne kuch dino se ${args.brandName} ka marketing task nahi kiya. Dukan badhani hai toh consistency chahiye! Aaj ka task check karo: ${siteUrl}/dashboard`,
      });
      console.log("WhatsApp nudge sent:", message.sid);
    } catch (error) {
      console.error("Error sending WhatsApp nudge:", error);
    }
  },
});


export const sendDailyTask = internalAction({
  args: { 
    phoneNumber: v.string(), 
    brandName: v.string(),
    currentDay: v.number(),
    taskTitle: v.string()
  },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    
    if (!accountSid || !authToken) return;

    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      await client.messages.create({
        from: fromNumber,
        to: `whatsapp:${args.phoneNumber.startsWith('+') ? args.phoneNumber : '+91' + args.phoneNumber}`,
        body: `*Good Morning!* ☀️\n\n${args.brandName} ke liye aaj ki marketing tip (Day ${args.currentDay}):\n\n🎯 *${args.taskTitle}*\n\nAaj ye task complete karein aur dukan badhayein! Check dashboard: ${siteUrl}/dashboard`,
      });
    } catch (error) {
      console.error("WhatsApp error (sendDailyTask):", error);
    }
  },
});

export const sendIncompleteReminder = internalAction({
  args: { 
    phoneNumber: v.string(), 
    brandName: v.string(),
    currentDay: v.number(),
    taskTitle: v.string()
  },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    
    if (!accountSid || !authToken) return;

    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      await client.messages.create({
        from: fromNumber,
        to: `whatsapp:${args.phoneNumber.startsWith('+') ? args.phoneNumber : '+91' + args.phoneNumber}`,
        body: `*Oye!* ⏰\n\nAapne aaj ka ${args.brandName} ka marketing task abhi tak mark 'Done' nahi kiya!\n\n🎯 *${args.taskTitle}*\n\nKaam poora karein aur MOM engine pe update karein: ${siteUrl}/dashboard`,
      });
    } catch (error) {
      console.error("WhatsApp error (sendIncompleteReminder):", error);
    }
  },
});

export const sendWelcomeMessage = internalAction({
  args: { 
    phoneNumber: v.string(), 
    brandName: v.string()
  },
  handler: async (_ctx, args) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
    
    if (!accountSid || !authToken) return;

    const client = twilio(accountSid, authToken);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    try {
      await client.messages.create({
        from: fromNumber,
        to: `whatsapp:${args.phoneNumber.startsWith('+') ? args.phoneNumber : '+91' + args.phoneNumber}`,
        body: `🎉 *Welcome to MOM, ${args.brandName}!* 🎉\n\nMai hoon aapka naya marketing brain 🧠. Aapka 30-day growth roadmap taiyaar ho gaya hai! \n\nAaj se har roz mai aapko direct yaha message karke aapka daily task samjhaunga. \n\nCheck your full roadmap here: ${siteUrl}/dashboard`,
      });
    } catch (error) {
      console.error("WhatsApp error (sendWelcomeMessage):", error);
    }
  },
});

