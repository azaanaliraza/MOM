import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Check if user exists by clerkId (new index)
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
        // Fallback: check by tokenIdentifier (old index)
        user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();
    }

    if (user !== null) {
        // If user existed but didn't have clerkId mapped yet, update it
        if (!user.clerkId || user.isPremium === undefined) {
            await ctx.db.patch(user._id, {
                clerkId: identity.subject,
                isPremium: user.isPremium ?? false
            });
        }
        return user._id;
    }

    // If new user, create them as "Free"
    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      email: identity.email ?? "no-email",
      clerkId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      isPremium: false, // Default to 3 limit
    });
  },
});
