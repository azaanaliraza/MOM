<p align="center">
  <img src="https://img.shields.io/badge/MOM-Mother%20of%20Marketing-6366f1?style=for-the-badge&labelColor=1e1b4b" alt="MOM Badge" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Convex-Backend-ef4444?style=for-the-badge" alt="Convex" />
  <img src="https://img.shields.io/badge/Gemini-AI-4285f4?style=for-the-badge&logo=google" alt="Gemini" />
</p>

<h1 align="center">⚡ MOM — Mother of Marketing</h1>
<p align="center"><strong>India's first AI marketing engine built for Bharat's small businesses.</strong></p>
<p align="center">
  Generate hyper-local 30-day marketing roadmaps, auto-execute strategies with Agent Karya,<br/>
  and get Hinglish marketing advice — all powered by AI.
</p>

---

## 🎯 What is MOM?

MOM is an AI-powered marketing platform designed for **Indian small business owners** (Tier 2/3 cities). Instead of hiring a marketing agency, a chai shop owner in Lucknow or a tyre dealer in Indore can:

1. **Describe their business** → MOM generates a 30-day localized marketing roadmap
2. **Execute daily tasks** → Agent Karya creates posters, reel scripts, and captions automatically
3. **Chat with MOM Bhaiya** → Get Hinglish marketing advice specific to their shop
4. **Track progress** → Mark tasks as done, get nudge emails if inactive

---

## ✨ Features

| Feature | Description | AI Model |
|---------|-------------|----------|
| 🗺️ **30-Day Roadmap** | AI-generated daily marketing plan with local insights | Gemini 3 Flash |
| 🤖 **Agent Karya** | Auto-generates reel scripts, poster captions, and execution guides | Llama 3.3 70B (HuggingFace) |
| 🎨 **Poster Generator** | Marketing poster creation from text prompts | FLUX.1 Schnell (HuggingFace) |
| 📱 **Reel Generator** | 9:16 vertical reel-style images for Instagram/Shorts | FLUX.1 Schnell (HuggingFace) |
| 💬 **MOM Concierge Chat** | Hinglish marketing mentor with business context memory | Gemini 2.5 Flash |
| 👁️ **Vision Vault** | Upload shop photos → AI extracts product/price intelligence | Gemini 3 Flash |
| ✅ **Mark as Done** | Interactive task completion tracking with progress bar | — |
| 📧 **Nudge System** | Auto email reminders if user is inactive for 3+ days | Resend + Convex Crons |
| 🔗 **MCP Server** | 12-tool MCP server for Claude Desktop / Cursor integration | — |
| 🧩 **Chrome Extension** | Quick dashboard in your browser showing today's task | — |

---

## 🏗️ Tech Stack

```
Frontend:    Next.js 16 · React 19 · Framer Motion · Tailwind CSS 4
Backend:     Convex (real-time database, cron jobs, file storage)
Auth:        Clerk (Google + Email login)
AI Models:   Google Gemini 3 Flash · Gemini 2.5 Flash · Meta Llama 3.3 70B · FLUX.1 Schnell
Email:       Resend (automated nudge emails)
Payments:    Razorpay (INR payments for Premium)
Protocol:    Model Context Protocol (MCP) for AI assistant integration
Extension:   Chrome Manifest V3 browser extension
```

---

## 📁 Project Structure

```
MOM/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page + onboarding form
│   │   ├── dashboard/page.tsx    # Main marketing dashboard
│   │   ├── premium/page.tsx      # Premium upgrade page
│   │   ├── api/
│   │   │   ├── generate/         # POST — Roadmap generation (Gemini)
│   │   │   ├── chat/             # POST — MOM concierge chat (Gemini)
│   │   │   ├── karya/generate/   # POST — Agent Karya strategy (Llama)
│   │   │   ├── karya/generate/image/  # POST — Poster (FLUX)
│   │   │   ├── karya/generate/video/  # POST — Reel (FLUX)
│   │   │   └── payments/razorpay/     # POST — Payment webhook
│   │   └── actions/vision.ts     # Server action — Image intelligence
│   └── components/
│       ├── ChatAgent.tsx          # Floating MOM chat widget
│       ├── KaryaTab.tsx           # Agent Karya execution panel
│       ├── ConnectTab.tsx         # Integrations tab
│       └── VisionVault.tsx        # Business photo upload + AI analysis
├── convex/
│   ├── schema.ts                  # Database schema (users, roadmaps, messages)
│   ├── roadmaps.ts                # CRUD + task completion mutations
│   ├── users.ts                   # User management + premium upgrades
│   ├── messages.ts                # Chat message storage
│   ├── vision.ts                  # Image context extraction action
│   ├── email.ts                   # Resend nudge email action
│   └── crons.ts                   # Daily inactivity check cron job
├── mcp-server/
│   └── index.ts                   # MCP server (12 tools via stdio)
├── chrome-extension/
│   ├── manifest.json              # Chrome Manifest V3
│   ├── popup.html                 # Extension popup UI
│   ├── popup.css                  # Extension styles
│   └── popup.js                   # Extension logic (Convex API calls)
└── mcp-config.json                # Claude Desktop / Cursor MCP config
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/ritikteotia/Vigyapan-ai.git
cd Vigyapan-ai
bun install
```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google AI
GEMINI_API_KEY=AIza...

# HuggingFace (for Agent Karya + FLUX)
HF_TOKEN=hf_...

# Razorpay (payments)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# Resend (email nudges)
RESEND_API_KEY=re_...
NEXT_PUBLIC_SITE_URL=https://mom-pearl-delta.vercel.app
```

### 3. Start Convex + Dev Server

```bash
# Terminal 1: Convex backend
npx convex dev

# Terminal 2: Next.js frontend
bun dev
```

Open [https://mom-pearl-delta.vercel.app](https://mom-pearl-delta.vercel.app) and sign in to get started.

### 4. (Optional) Start MCP Server

```bash
# Terminal 3: MCP server for Claude Desktop / Cursor
bun run mcp
```

---

## 🧠 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/generate` | Generate 30-day roadmap (Gemini 3 Flash) |
| POST | `/api/chat` | Chat with MOM Bhaiya (Gemini 2.5 Flash) |
| POST | `/api/karya/generate` | Agent Karya daily strategy (Llama 3.3 70B) |
| POST | `/api/karya/generate/image` | Marketing poster (FLUX.1 Schnell 1024×1024) |
| POST | `/api/karya/generate/video` | Vertical reel image (FLUX.1 Schnell 720×1280) |
| POST | `/api/payments/razorpay` | Razorpay payment verification + premium upgrade |

---

## 🔌 MCP Server

MOM includes a **12-tool MCP server** for integration with Claude Desktop, Cursor, or any MCP client.

```bash
bun run mcp
```

**Tools:** `generate_roadmap`, `list_roadmaps`, `get_roadmap`, `get_latest_roadmap`, `toggle_task_completion`, `update_manual_context`, `generate_karya_strategy`, `generate_poster`, `generate_reel`, `chat_with_mom`, `get_user_profile`, `get_chat_history`

See [`mcp-config.json`](mcp-config.json) for Claude Desktop / Cursor setup.

---

## 🧩 Chrome Extension

The MOM Chrome Extension gives users a quick glance at their marketing progress right from the browser toolbar.

**Features:**
- 🔐 Automatic login — just sign in once on the MOM website, the extension detects your session
- 📊 Current day progress with visual ring
- 📋 Today's task with execution steps
- ⏭️ Next 3 upcoming tasks preview
- ✅ Quick "Mark as Done" button
- 🔗 One-click link to full dashboard

**Install:** Load `chrome-extension/` as an unpacked extension → `chrome://extensions` → Developer mode → Load unpacked.

**Usage:** Click the extension icon → if not logged in, click "Sign in with Google" → sign in on the MOM website → reopen the extension to see your dashboard.

---

## 💳 Premium

| Feature | Free | Premium (₹499) |
|---------|------|-----------------|
| Roadmaps | 3 max | 100 max |
| Agent Karya | ❌ | ✅ |
| Vision Vault | ❌ | ✅ |
| Poster/Reel Gen | ❌ | ✅ |
| MOM Chat | ✅ | ✅ |
| Nudge Emails | ✅ | ✅ |

---

## 📬 Nudge System

A **daily Convex cron job** checks all roadmaps for users who haven't been active in 3+ days. It automatically sends a friendly Hinglish email via Resend:

> *"Oye! Aapne kuch dino se [Brand] ka marketing task nahi kiya. Dukan badhani hai toh consistency chahiye!"*

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  <strong>Built with ❤️ for Bharat's small businesses</strong><br>
  <sub>MOM — Because every dukaan deserves a marketing engine.</sub>
</p>
