"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function SyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Extract data from Gmail/Clerk
      const name = user.fullName || user.firstName || "User";
      const email = user.primaryEmailAddress?.emailAddress || "no-email";
      const pictureUrl = user.imageUrl;
      const phoneNumber = user.primaryPhoneNumber?.phoneNumber || "";

      // Push to Convex
      storeUser({
        clerkId: user.id,
        name: name,
        email: email,
        pictureUrl: pictureUrl,
        phoneNumber: phoneNumber,
      });
    }
  }, [isLoaded, isSignedIn, user, storeUser]);

  return null; // This component doesn't render anything
}
