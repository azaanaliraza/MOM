"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendNudgeEmail = internalAction({
  args: { email: v.string(), brandName: v.string() },
  handler: async (_ctx, args) => {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mom-pearl-delta.vercel.app";

    await resend.emails.send({
      from: "MOM Bhaiya <onboarding@resend.dev>",
      to: args.email,
      subject: `Bhai, ${args.brandName} ka progress ruk gaya hai?`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FAFAFA; border-radius: 24px;">
          <h1 style="font-size: 24px; color: #1c1917; margin-bottom: 8px;">Oye! 👋</h1>
          <p style="font-size: 16px; color: #57534e; line-height: 1.6;">
            Aapne kuch dino se <strong>${args.brandName}</strong> ka marketing task nahi kiya.
            Dukan badhani hai toh consistency chahiye!
          </p>
          <a href="${siteUrl}/dashboard" style="display: inline-block; margin-top: 24px; padding: 14px 32px; background: #4f46e5; color: white; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 14px; letter-spacing: 1px;">
            AAJ KA TASK CHECK KARO →
          </a>
          <p style="font-size: 12px; color: #a8a29e; margin-top: 24px;">— MOM Bhaiya, your marketing engine</p>
        </div>
      `,
    });
  },
});
