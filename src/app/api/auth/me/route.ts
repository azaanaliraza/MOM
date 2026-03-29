import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/me
 * Returns the current user's Clerk ID and basic info.
 * Used by the Chrome extension to identify the logged-in user.
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await currentUser();

    return NextResponse.json({
      clerkId: userId,
      name: user?.firstName
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
        : user?.emailAddresses?.[0]?.emailAddress ?? "User",
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      imageUrl: user?.imageUrl ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Auth check failed" },
      { status: 500 }
    );
  }
}
