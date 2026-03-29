/**
 * MOM Chrome Extension — Popup Logic
 *
 * Connects directly to Convex cloud via REST API.
 * No bundler needed — plain JS for Manifest V3.
 */

// ── Convex REST helpers ───────────────────────────────────────────────
async function convexQuery(baseUrl, fnPath, args) {
  const res = await fetch(`${baseUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args, format: "json" }),
  });
  if (!res.ok) throw new Error(`Convex query failed: ${res.status}`);
  const data = await res.json();
  return data.value !== undefined ? data.value : data;
}

async function convexMutation(baseUrl, fnPath, args) {
  const res = await fetch(`${baseUrl}/api/mutation`, {
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

const setupScreen  = $("setup-screen");
const mainScreen   = $("main-screen");
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

// ── Config Management ─────────────────────────────────────────────────
function saveConfig(convexUrl, clerkId) {
  chrome.storage.local.set({ convexUrl, clerkId });
}

function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["convexUrl", "clerkId"], (data) => {
      resolve({ convexUrl: data.convexUrl, clerkId: data.clerkId });
    });
  });
}

// ── Screen Control ────────────────────────────────────────────────────
function showScreen(screen) {
  [setupScreen, mainScreen, loadingScreen].forEach((s) =>
    s.classList.add("hidden")
  );
  screen.classList.remove("hidden");
}

// ── Render Dashboard ──────────────────────────────────────────────────
async function loadDashboard(convexUrl, clerkId) {
  showScreen(loadingScreen);

  try {
    // 1. Fetch latest roadmap
    const roadmap = await convexQuery(convexUrl, "roadmaps:getLatest", {
      userId: clerkId,
    });

    if (!roadmap) {
      showScreen(setupScreen);
      alert("No roadmap found. Create one on the MOM website first!");
      return;
    }

    // 2. Parse data
    const data = roadmap.data || {};
    const plan = data.thirtyDayPlan || data.roadmap || [];
    const completedDays = roadmap.completedDays || [];
    const completedCount = completedDays.length;
    const brand = data.brand || {
      name: roadmap.brandName,
      city: roadmap.location,
    };

    // 3. Figure out current day (first uncompleted day, or last day)
    let currentDay = 1;
    for (let i = 1; i <= 30; i++) {
      if (!completedDays.includes(i)) {
        currentDay = i;
        break;
      }
      if (i === 30) currentDay = 30;
    }

    const todayData = plan.find((d) => d.day === currentDay) || plan[0] || {};
    const isDone = completedDays.includes(currentDay);

    // ─── Header ─────────────────────────────────────────────
    $("brand-name").textContent = brand.name || roadmap.brandName;
    $("brand-location").textContent = brand.city || roadmap.location || "";

    // ─── Progress Ring ──────────────────────────────────────
    $("progress-count").textContent = completedCount;
    const pct = Math.round((completedCount / 30) * 100);
    $("progress-pct").textContent = `${pct}% complete`;

    const circle = $("progress-circle");
    const circumference = 2 * Math.PI * 52; // r=52
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference - (pct / 100) * circumference;
    circle.style.stroke = "#22c55e";

    // ─── Today's Task ───────────────────────────────────────
    $("today-day").textContent = currentDay;
    $("today-label").textContent = todayData.label || `Day ${currentDay} Task`;

    // Steps
    const stepsContainer = $("today-steps");
    stepsContainer.innerHTML = "";
    const steps = todayData.execution_steps || [];
    steps.slice(0, 3).forEach((step, i) => {
      const div = document.createElement("div");
      div.className = "step-item";
      div.innerHTML = `
        <span class="step-num">${i + 1}</span>
        <span class="step-text">${step}</span>
      `;
      stepsContainer.appendChild(div);
    });

    // Done state
    const todayCard = $("today-card");
    const doneBtn = $("mark-done-btn");
    const doneIcon = $("done-icon");
    const doneText = $("done-text");

    function updateDoneState(done) {
      if (done) {
        todayCard.classList.add("is-done");
        doneBtn.classList.add("is-done");
        doneIcon.textContent = "✓";
        doneText.textContent = "Done! Shabaash!";
      } else {
        todayCard.classList.remove("is-done");
        doneBtn.classList.remove("is-done");
        doneIcon.textContent = "○";
        doneText.textContent = "Mark as Done";
      }
    }
    updateDoneState(isDone);

    // Mark done handler
    doneBtn.onclick = async () => {
      doneBtn.disabled = true;
      doneBtn.style.opacity = "0.6";
      try {
        await convexMutation(convexUrl, "roadmaps:toggleTaskCompletion", {
          roadmapId: roadmap._id,
          dayNumber: currentDay,
        });
        const nowDone = !todayCard.classList.contains("is-done");
        updateDoneState(nowDone);

        // Update progress
        const newCount = nowDone ? completedCount + 1 : completedCount - 1;
        $("progress-count").textContent = newCount;
        const newPct = Math.round((newCount / 30) * 100);
        $("progress-pct").textContent = `${newPct}% complete`;
        circle.style.strokeDashoffset =
          circumference - (newPct / 100) * circumference;
      } catch (err) {
        console.error("Toggle error:", err);
        alert("Could not update. Check connection.");
      } finally {
        doneBtn.disabled = false;
        doneBtn.style.opacity = "1";
      }
    };

    // ─── Upcoming Tasks ─────────────────────────────────────
    const upcomingList = $("upcoming-list");
    upcomingList.innerHTML = "";

    const upcoming = plan
      .filter((d) => d.day > currentDay)
      .slice(0, 3);

    if (upcoming.length === 0) {
      upcomingList.innerHTML =
        '<p style="font-size:11px;color:#a8a29e;text-align:center;padding:8px">🎉 All tasks visible! You\'re crushing it.</p>';
    } else {
      upcoming.forEach((task) => {
        const isCompleted = completedDays.includes(task.day);
        const item = document.createElement("div");
        item.className = `upcoming-item${isCompleted ? " completed" : ""}`;
        item.innerHTML = `
          <span class="upcoming-day">Day ${task.day}</span>
          <span class="upcoming-label">${task.label || "Task"}</span>
          <span class="upcoming-check">${isCompleted ? "✅" : "⬜"}</span>
        `;
        upcomingList.appendChild(item);
      });
    }

    // ─── Footer Link ────────────────────────────────────────
    $("open-dashboard").href = "https://mom-pearl-delta.vercel.app/dashboard";

    showScreen(mainScreen);
  } catch (err) {
    console.error("Dashboard load error:", err);
    showScreen(setupScreen);
    alert("Connection failed. Check your Convex URL and Clerk ID.");
  }
}

// ── Init ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  injectSvgGradient();

  const config = await getConfig();

  // Settings button → reset
  $("settings-btn").addEventListener("click", () => {
    chrome.storage.local.clear();
    showScreen(setupScreen);
  });

  // Save config + load
  $("save-config").addEventListener("click", () => {
    const convexUrl = $("convex-url").value.trim();
    const clerkId = $("clerk-id").value.trim();

    if (!convexUrl || !clerkId) {
      alert("Both fields are required.");
      return;
    }

    saveConfig(convexUrl, clerkId);
    loadDashboard(convexUrl, clerkId);
  });

  // Auto-load if already configured
  if (config.convexUrl && config.clerkId) {
    loadDashboard(config.convexUrl, config.clerkId);
  } else {
    showScreen(setupScreen);
  }
});
