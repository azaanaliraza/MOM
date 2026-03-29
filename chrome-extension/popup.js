/**
 * MOM Chrome Extension — Popup Logic (v2.1)
 *
 * Auth flow:
 *   1. Check chrome.storage.local for a 'cachedUser' (synced from background.js)
 *   2. If missing, try reading cookies from the MOM website directly
 *   3. If both fail, show the 'Login with Google' screen
 *
 * This version uses the background sync method for zero-config identity!
 */

// ── Constants ─────────────────────────────────────────────────────────
const SITE_URL = "https://mom-pearl-delta.vercel.app";
const CONVEX_URL = "https://necessary-fish-39.eu-west-1.convex.cloud";
const SITE_DOMAIN = "mom-pearl-delta.vercel.app";

// ── Convex REST helpers ───────────────────────────────────────────────
async function convexQuery(fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`Convex query failed: ${res.status}`);
  const data = await res.json();
  return data.value !== undefined ? data.value : data;
}

async function convexMutation(fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`Convex mutation failed: ${res.status}`);
  const data = await res.json();
  return data.value !== undefined ? data.value : data;
}

// ── DOM refs ──────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const loginScreen = $("login-screen");
const mainScreen = $("main-screen");
const loadingScreen = $("loading-screen");

// ── SVG Gradient (inject into progress ring) ──────────────────────────
function injectSvgGradient() {
  const svg = document.querySelector(".progress-ring");
  if (!svg) return;
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e" />
      <stop offset="100%" style="stop-color:#10b981" />
    </linearGradient>
  `;
  svg.prepend(defs);
}

// ── JWT Decode (Fallback) ────────────────────────────────────
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4 !== 0) payload += "=";
    return JSON.parse(atob(payload));
  } catch (err) { return null; }
}

// ── Auth helpers ──────────────────────────────────────────────────────

async function getLoggedInUser() {
  try {
    // 1. Check storage first (populated by background script sync)
    const storage = await chrome.storage.local.get(["cachedUser", "lastSync"]);
    if (storage.cachedUser && storage.cachedUser.clerkId) {
      console.log("Auth from Storage sync");
      return storage.cachedUser;
    }

    // 2. Fallback: Check cookies from domain
    const cookies = await chrome.cookies.getAll({ domain: SITE_DOMAIN });
    const sessionCookie = cookies.find((c) => c.name === "__session");
    if (sessionCookie && sessionCookie.value) {
      const payload = decodeJwtPayload(sessionCookie.value);
      if (payload && payload.sub) {
        console.log("Auth from Cookies fallback");
        const userData = {
          clerkId: payload.sub,
          name: payload.name || payload.first_name || "User",
          imageUrl: payload.image_url || null,
        };
        // Save to storage
        await chrome.storage.local.set({ cachedUser: userData, lastSync: Date.now() });
        return userData;
      }
    }

    return null;
  } catch (err) {
    console.error("Auth helper error:", err);
    return null;
  }
}

// ── Screen Control ────────────────────────────────────────────────────
function showScreen(screen) {
  [loginScreen, mainScreen, loadingScreen].forEach((s) => s.classList.add("hidden"));
  screen.classList.remove("hidden");
}

function setUserAvatar(userData) {
  const avatar = $("user-avatar");
  if (!avatar) return;
  if (userData.imageUrl) {
    avatar.style.backgroundImage = `url(${userData.imageUrl})`;
    avatar.style.backgroundSize = "cover";
    avatar.textContent = "";
  } else {
    avatar.textContent = (userData.name || "U").charAt(0).toUpperCase();
  }
}

// ── Render Dashboard ──────────────────────────────────────────────────
async function loadDashboard(clerkId, userData) {
  showScreen(loadingScreen);
  try {
    setUserAvatar(userData);
    const roadmap = await convexQuery("roadmaps:getLatest", { userId: clerkId });

    if (!roadmap) {
      showScreen(loginScreen);
      const loginBody = document.querySelector(".login-body");
      if (loginBody) {
        loginBody.innerHTML = `
          <div class="no-roadmap-box">
             <h2 style="font-size:18px;margin-bottom:8px">No Roadmap Found</h2>
             <p style="font-size:11px;color:#a8a29e;margin-bottom:16px">You haven't created a marketing strategy yet. Create one on the website to see it here!</p>
             <a href="${SITE_URL}/dashboard" target="_blank" class="btn-google">Create Strategy →</a>
          </div>
        `;
      }
      return;
    }

    // Parse progress & data
    const data = roadmap.data || {};
    const plan = data.thirtyDayPlan || data.roadmap || [];
    const completedDays = roadmap.completedDays || [];
    const completedCount = completedDays.length;

    let currentDay = 1;
    for (let i = 1; i <= 30; i++) {
        if (!completedDays.includes(i)) { currentDay = i; break; }
        if (i === 30) currentDay = 30;
    }

    const todayData = plan.find((d) => d.day === currentDay) || plan[0] || {};
    const isDone = completedDays.includes(currentDay);

    $("brand-name").textContent = roadmap.brandName || "My Business";
    $("brand-location").textContent = roadmap.location || "";
    $("progress-count").textContent = completedCount;
    const pct = Math.round((completedCount / 30) * 100);
    $("progress-pct").textContent = `${pct}% complete`;

    const circle = $("progress-circle");
    const circ = 2 * Math.PI * 52;
    circle.style.strokeDasharray = circ;
    circle.style.strokeDashoffset = circ - (pct / 100) * circ;

    $("today-day").textContent = currentDay;
    $("today-label").textContent = todayData.label || `Day ${currentDay} Task`;

    const stepsContainer = $("today-steps");
    stepsContainer.innerHTML = "";
    (todayData.execution_steps || []).slice(0, 3).forEach((step, i) => {
      const div = document.createElement("div");
      div.className = "step-item";
      div.innerHTML = `<span class="step-num">${i + 1}</span><span class="step-text">${step}</span>`;
      stepsContainer.appendChild(div);
    });

    const doneBtn = $("mark-done-btn");
    const todayCard = $("today-card");
    const doneText = $("done-text");

    const updateDoneState = (done) => {
        if (done) {
            todayCard.classList.add("is-done");
            doneBtn.classList.add("is-done");
            doneText.textContent = "Done! Shabaash!";
        } else {
            todayCard.classList.remove("is-done");
            doneBtn.classList.remove("is-done");
            doneText.textContent = "Mark as Done";
        }
    };
    updateDoneState(isDone);

    doneBtn.onclick = async () => {
        doneBtn.disabled = true;
        try {
            await convexMutation("roadmaps:toggleTaskCompletion", { roadmapId: roadmap._id, dayNumber: currentDay });
            const nowDone = !todayCard.classList.contains("is-done");
            updateDoneState(nowDone);
            const newCount = nowDone ? completedCount + 1 : completedCount - 1;
            $("progress-count").textContent = newCount;
            const newPct = Math.round((newCount / 30) * 100);
            $("progress-pct").textContent = `${newPct}% complete`;
            circle.style.strokeDashoffset = circ - (newPct / 100) * circ;
        } catch (e) { alert("Failed to update status."); }
        finally { doneBtn.disabled = false; }
    };

    const upcomingList = $("upcoming-list");
    upcomingList.innerHTML = "";
    plan.filter(d => d.day > currentDay).slice(0, 3).forEach(task => {
        const item = document.createElement("div");
        item.className = "upcoming-item";
        item.innerHTML = `<span class="upcoming-day">Day ${task.day}</span><span class="upcoming-label">${task.label}</span><span>⬜</span>`;
        upcomingList.appendChild(item);
    });

    $("open-dashboard").href = `${SITE_URL}/dashboard`;
    showScreen(mainScreen);
  } catch (err) {
    console.error("Dashboard load failed:", err);
    showScreen(loginScreen);
  }
}

// ── Init ──────────────────────────────────────────────────────────────
async function init() {
    showScreen(loadingScreen);
    const user = await getLoggedInUser();
    if (user && user.clerkId) {
        await loadDashboard(user.clerkId, user);
    } else {
        showScreen(loginScreen);
    }
}

document.addEventListener("DOMContentLoaded", () => {
  injectSvgGradient();

  $("sign-in-btn").addEventListener("click", () => {
    // Try to open the site. If the user is already on localhost, maybe he wants that.
    window.open(SITE_URL, '_blank');
  });

  $("logout-btn").addEventListener("click", async () => {
    await chrome.storage.local.clear();
    location.reload();
  });

  init();
});
