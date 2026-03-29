/**
 * MOM Chrome Extension — Background Script
 * Handles identity sync from the website Content Script.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_USER") {
    // Only save if data is present
    if (message.user && message.user.clerkId) {
      chrome.storage.local.set({ 
        cachedUser: message.user,
        lastSync: Date.now()
      }, () => {
        console.log("User synced from website:", message.user.clerkId);
      });
    }
  }
});

// Periodic check can go here if needed
