<div align="center">

<img src="public/favicon.svg" width="64" height="64" alt="ExamWise AI Logo" />

# ExamWise AI

**A student-focused examination preparation platform that transforms scattered academic resources into organised study materials, historical exam insights, and personalised preparation plans.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB%20%2B%20Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Application Workflow](#application-workflow)
6. [Folder Structure](#folder-structure)
7. [Getting Started](#getting-started)
8. [Supabase Setup](#supabase-setup)
9. [Environment Variables](#environment-variables)
10. [Deployment](#deployment)
11. [UN SDG Alignment](#un-sdg-alignment)
12. [Contributing](#contributing)

---

## Overview

ExamWise AI is a full-stack web application built for engineering students — specifically for the **B.Tech AI & Data Science** programme — to help them study smarter, not harder. The platform aggregates historical question papers, maps them to syllabus topics, surfaces frequency-based exam trends, and generates personalised study plans.

> **Demo Mode:** The app runs fully in the browser without a backend connection. Once Supabase credentials are added, it switches to live mode with real authentication and database-backed data.

### The Problem It Solves

Engineering students waste hours hunting for past papers across college portals, WhatsApp groups, and physical archives. Examination patterns buried across five years of papers are never surfaced systematically. ExamWise AI automates this — giving every student a structured, evidence-based preparation advantage.

---

## Key Features

| Module | Description |
|--------|-------------|
| 📄 **Question Paper Library** | Searchable, filterable archive of past papers (year, exam type, subject). One-click PDF download via signed private URLs. |
| 📊 **Exam Intelligence** | Historical frequency analysis — how often each topic appeared across 5 years, mark-share per unit, repeated-question detection. |
| 📚 **Syllabus Explorer** | Unit-by-unit syllabus with completion tracking. Topics linked to historical questions and evidence count. |
| 🧪 **Mock Tests** | Configurable practice sessions — Previous Paper Mode or Historical Pattern-Based Mode. Live question palette, timer, and results. |
| 📅 **Study Planner** | Weekly schedule with task checklist. Priority-based daily focus derived from historical trends and mock performance. |
| 📈 **Performance Analytics** | Score progression across mock tests, unit-wise accuracy breakdown, and AI-generated improvement insights. |
| 🔍 **Analyze a Paper** | Upload any PDF question paper; the system extracts questions, maps them to syllabus topics, and compares them against the historical dataset. |
| 🤝 **Community Contributions** | Students submit and review shared resources. Verified contributions earn trusted-contributor status. |
| 🔐 **Authentication** | Supabase-powered sign-up, sign-in, and password reset. Optional college-email-domain enforcement. |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | Component-based UI |
| **TypeScript** | 5.7 | Type-safe development |
| **Vite** | 8 | Lightning-fast build & HMR |
| **Tailwind CSS** | 4 | Utility-first responsive styling |

### Backend & Infrastructure
| Technology | Purpose |
|---|---|
| **Supabase Auth** | Email/password authentication, session management, JWT |
| **Supabase Postgres** | Relational database — subjects, papers, syllabus, user profiles |
| **Supabase Storage** | Private PDF storage with time-limited signed URLs |
| **Row Level Security (RLS)** | Per-user data isolation enforced at the database level |

### Tooling & Deployment
| Tool | Purpose |
|---|---|
| **Vercel** | Primary deployment (auto-detects Vite) |
| **Netlify** | Alternative deployment (netlify.toml included) |
| **Node.js scraper** | `scripts/scrape-college.mjs` — seeds paper data from your college website |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (Client)                  │
│                                                      │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  React UI  │  │ AuthProvider │  │  data.ts    │ │
│  │  App.tsx   │  │ (Context)    │  │  hooks      │ │
│  └─────┬──────┘  └──────┬───────┘  └──────┬──────┘ │
│        │                │                  │        │
│        └────────────────┴──────────────────┘        │
│                         │                           │
│              supabase-js client                     │
└─────────────────────────┬───────────────────────────┘
                          │  HTTPS + JWT
          ┌───────────────┼────────────────┐
          │               │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │  Supabase   │ │  Supabase   │ │  Supabase   │
   │    Auth     │ │  Postgres   │ │   Storage   │
   │             │ │   (RLS)     │ │  (PDFs)     │
   └─────────────┘ └─────────────┘ └─────────────┘
```

### Database Schema

```
subjects ──────< papers
    │                  └── file_path → Storage bucket
    └─── syllabus_units ──< syllabus_topics
                                   │
auth.users ──< profiles            └──< topic_progress (per user)
         └──────────────────────────── saved_papers (per user)
```

**Key design decisions:**
- `supabaseConfigured` flag in [`src/lib/supabase.ts`](src/lib/supabase.ts) — allows demo mode when env vars are absent.
- All data hooks (`useSubjects`, `usePapers`) fall back to hardcoded demo data when Supabase is not connected.
- RLS policies ensure a user can only read/write their own progress and saved papers; reference data (subjects, papers, syllabus) is readable by any authenticated user.
- PDF files are stored in a **private** bucket; downloads go through signed URLs that expire in 10 minutes.

---

## Application Workflow

```
Student visits the app
        │
        ▼
  .env configured?
  ┌─────┴─────┐
 NO           YES
  │             │
  ▼             ▼
Demo Mode   Login Page
(no auth)   (Supabase Auth)
  │             │
  │         Sign Up / Sign In
  │             │
  │         Profile auto-created
  │         (DB trigger)
  │             │
  └──────┬──────┘
         ▼
     Dashboard
  (subjects + papers load from DB)
         │
    ┌────┴─────────────────────────┐
    │                              │
    ▼                              ▼
Question Papers            Exam Intelligence
(browse, filter,           (topic frequency,
 download PDF)              unit marks, patterns)
    │                              │
    ▼                              ▼
Analyze a Paper            Study Planner
(upload PDF →              (weekly schedule,
 extract + map topics)      task checklist)
    │                              │
    ▼                              ▼
Mock Tests                 Performance Analytics
(configure → attempt        (score trends,
 → results)                  unit-wise accuracy)
```

---

## Folder Structure

```
examwise/
├── public/
│   └── favicon.svg
├── scripts/
│   └── scrape-college.mjs      # Node.js scraper to seed papers from college site
├── src/
│   ├── auth/
│   │   ├── AuthProvider.tsx    # Supabase session context, profile loader
│   │   └── LoginPage.tsx       # Sign-in / Sign-up / Password reset form
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client + supabaseConfigured flag
│   │   └── data.ts             # useSubjects(), usePapers(), paperUrl() hooks
│   ├── App.tsx                 # All page components + navigation
│   ├── main.tsx                # Entry — Gate component (auth guard)
│   ├── index.css               # Base + design tokens
│   ├── dashboard.css           # Dashboard-specific styles
│   ├── intelligence.css        # Exam Intelligence page styles
│   └── mobile.css              # Mobile-responsive overrides
├── supabase/
│   └── schema.sql              # Full DB schema, RLS policies, storage bucket
├── .env.example                # Environment variable template
├── .gitignore
├── netlify.toml
├── vercel.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 or **pnpm** / **npm**
- A free [Supabase](https://supabase.com) account (for live mode)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/examwise.git
cd examwise/examwise
npm install
```

### 2. Run in Demo Mode (no backend needed)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app loads with sample data — no login required.

### 3. Run in Live Mode (with Supabase)

```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

---

## Supabase Setup

### Step 1 — Create a Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to you (e.g., Singapore `ap-southeast-1`)
3. Wait ~2 minutes for provisioning

### Step 2 — Run the Schema

1. Dashboard → **SQL Editor** → **New query**
2. Paste the full contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Click **Run**

This creates all tables, RLS policies, the profile auto-creation trigger, and the private `papers` storage bucket.

### Step 3 — Seed Your Data

Run this in the SQL Editor to add your real subjects:

```sql
INSERT INTO subjects (code, name, branch, semester) VALUES
  ('AIML501', 'Design & Analysis of Algorithms',  'AI&DS', 5),
  ('AIML502', 'Software Engineering',              'AI&DS', 5),
  ('AIML503', 'Database Management Systems',       'AI&DS', 5),
  ('AIML504', 'Machine Learning',                  'AI&DS', 5),
  ('AIML505', 'Computer Networks',                 'AI&DS', 5),
  ('AIML506', 'Web Technologies',                  'AI&DS', 5)
ON CONFLICT (code, branch, semester) DO NOTHING;
```

### Step 4 — (Optional) Scrape Papers from College Website

```bash
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
COLLEGE_PAPERS_URL=https://your-college.edu/papers \
npm run scrape
```

> ⚠️ Check your college website's terms of use before running the scraper. Use the service-role key **only locally** — never commit it or expose it as a `VITE_` variable.

### Step 5 — Configure Authentication

1. Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your deployed URL
3. Add `http://localhost:5173` to **Redirect URLs**
4. (Optional) Disable email confirmation while testing under **Auth → Settings → Email**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes (live mode) | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (live mode) | Supabase anon/public key (safe to expose in frontend) |
| `VITE_ALLOWED_EMAIL_DOMAIN` | No | Restricts sign-up to a college domain e.g. `college.edu.in` |

> Copy `.env.example` → `.env.local`. The `.env.local` file is git-ignored by default.

---

## Deployment

### Vercel (Recommended)

1. Push the `examwise/` folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Vercel auto-detects Vite. Set the **Root Directory** to `examwise` if needed.
4. Add environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_ALLOWED_EMAIL_DOMAIN`.
5. Deploy, then paste the live URL into Supabase → Authentication → Site URL.

### Netlify

A [`netlify.toml`](netlify.toml) is included. The same environment variables apply.

---

## UN SDG Alignment

ExamWise AI contributes to four United Nations Sustainable Development Goals:

---

### 🎓 SDG 4 — Quality Education

> *"Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all."*

ExamWise AI directly addresses Goal 4 by democratising access to academic resources. Students from any socioeconomic background can access verified past papers, structured syllabi, and intelligent study guidance — levelling the playing field that was previously tilted toward those with access to paid coaching or senior connections.

- **Targets addressed:** 4.1 (free, equitable quality education), 4.4 (relevant skills for employment)
- **Impact:** Structured, evidence-based preparation improves learning outcomes and reduces exam failure rates.

---

### ⚖️ SDG 10 — Reduced Inequalities

> *"Reduce inequality within and among countries."*

The platform removes information asymmetry. Previously, students with senior contacts or access to coaching institutes had a structural advantage over first-generation college students. ExamWise AI makes the same historical data, insights, and study plans freely available to every enrolled student.

- **Targets addressed:** 10.2 (social, economic, political inclusion of all)
- **Impact:** Equal preparation resources regardless of social network or financial background.

---

### 💡 SDG 9 — Industry, Innovation & Infrastructure

> *"Build resilient infrastructure, promote inclusive and sustainable industrialisation and foster innovation."*

ExamWise AI demonstrates how modern open-source technology (React, Supabase, Vite) can be applied to build scalable educational infrastructure at near-zero cost. The architecture — serverless, edge-deployed, database-as-a-service — is a replicable blueprint for digital transformation in educational institutions.

- **Targets addressed:** 9.b (domestic technology development), 9.c (universal access to digital infrastructure)
- **Impact:** Proof-of-concept for low-cost, high-impact edtech infrastructure replicable across colleges.

---

### 🤝 SDG 17 — Partnerships for the Goals

> *"Strengthen the means of implementation and revitalise the global partnership for sustainable development."*

The Community Contributions module fosters a collaborative knowledge ecosystem. Students contribute verified question papers, peer-review submissions, and share notes — building a self-sustaining academic commons. This models the open-data partnership principle at the institutional level.

- **Targets addressed:** 17.16 (multi-stakeholder partnerships), 17.17 (effective partnerships)
- **Impact:** A student-driven, self-improving knowledge base that grows with each graduating batch.

---

<div align="center">

| SDG | Goal | Relevance |
|:---:|---|---|
| **4** | Quality Education | Core mission — evidence-based exam preparation for all |
| **10** | Reduced Inequalities | Removes information asymmetry between student cohorts |
| **9** | Industry & Innovation | Scalable open-source edtech infrastructure blueprint |
| **17** | Partnerships | Community-contributed, peer-verified academic knowledge base |

</div>

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please ensure your changes work in both demo mode and Supabase-connected mode.

---

<div align="center">

Built with ❤️ for engineering students · ExamWise AI © 2026

*Study smarter. Prepare with confidence.*

</div>
