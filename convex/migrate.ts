import { mutation } from "./_generated/server";

export const migrateBusinessVault = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    for (const user of users) {
      if (user.businessVault) {
        // Find the latest roadmap for this user (clerkId)
        const latestRoadmap = await ctx.db
          .query("roadmaps")
          .withIndex("by_user", (q) => q.eq("userId", user.clerkId))
          .order("desc")
          .first();

        // If a roadmap exists, move context if the roadmap's context is empty
        if (latestRoadmap && !latestRoadmap.businessVault) {
           await ctx.db.patch(latestRoadmap._id, {
             businessVault: user.businessVault
           });
        }
        
        // Remove from user (requires schema update later)
        // For now, we manually unset it if possible or just leave it
        // Actually, we can't fully 'unset' in Convex without schema allowing null/optional
        // But we already have it as optional, so we can set it to undefined in patch? No.
        // We'll just patch it with null/undefined if schema allows (not easily).
        // Let's just leave it for now until we are ready to remove from schema.
      }
    }
  },
});
