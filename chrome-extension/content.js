/**
 * MOM Chrome Extension — Content Script
 * 
 * Runs on mom-pearl-delta.vercel.app to sync the user's identity
 * with the extension automatically.
 */

function syncUser() {
  // Look for the user meta-container we added to Navbar.tsx
  const userContainer = document.querySelector('[data-clerk-user-id]');
  
  if (userContainer) {
    const userId = userContainer.getAttribute('data-clerk-user-id');
    const userName = userContainer.getAttribute('data-clerk-user-name');
    const userImage = userContainer.getAttribute('data-clerk-user-image');
    
    // Check if valid User ID (Clerk IDs start with user_ or are non-empty)
    if (userId && userId !== "undefined" && userId !== "null") {
      console.log("MOM Extension found user:", userId);
      chrome.runtime.sendMessage({ 
        type: "SYNC_USER", 
        user: { clerkId: userId, name: userName, imageUrl: userImage } 
      });
    }
  }
}

// Initial sync
syncUser();

// The page might load dynamically, so we watch for changes or check periodically
const observer = new MutationObserver(syncUser);
observer.observe(document.body, { childList: true, subtree: true });

// Check every 3 seconds to ensure we catch sign-ins
setInterval(syncUser, 3000);
