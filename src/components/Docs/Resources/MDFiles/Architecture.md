# Technical Architecture

How Viventory is built, and why — including answers to the open questions in
the user requirements document (Q1–Q5).

## Overview

```
┌─────────────────────────────┐
│  Tablet kiosk (children)     │  React UI, no login
│  Maker Bot · Room Map        │
├─────────────────────────────┤
│  Admin View (staff)          │  Google / demo login
│  Materials · Ideas · Requests│
├─────────────────────────────┤
│  Vite + React + TypeScript   │  one codebase
│  Tauri desktop shell (kiosk) │  or plain web app
├─────────────────────────────┤
│  Firebase                    │
│  · Firestore (live sync)     │  materials, materialRequests, projectIdeas
│  · Authentication (Google)   │  admin dashboard only
└─────────────────────────────┘
```

## Q1 — Technology stack

- **Frontend:** React 19 + TypeScript + Vite. One codebase serves the
  child-facing kiosk, the staff admin view, and the room map.
- **Desktop/kiosk shell:** Tauri (runs fullscreen on a dedicated device);
  the same build runs as a plain web app in any tablet browser, which is how
  it covers both **Android tablets and iPads**.
- **Rationale:** familiar student-level stack, huge ecosystem, free tooling,
  and a single codebase for every screen.

## Q2 — Rule-based chatbot (not an LLM)

The Maker Bot is **rule/keyword-based** (`makerspaceData.ts` →
`answerMakerQuery`). Chosen because:

- **Zero recurring cost** — no API fees, important for a free-to-operate app.
- **Predictable safety** — the adult-supervision warning is guaranteed to
  appear before instructions; an LLM could phrase or place it differently.
- **Fast** — answers are computed locally in milliseconds (well under the
  3-second requirement).
- Unanswerable questions fall back to "please ask a staff member" (Q5).

The data layer is separate from the matching logic, so an LLM API could be
added later without changing the admin dashboard or content model.

## Q3 — Cloud hosting: Firebase

- **Firestore** stores `materials`, `materialRequests`, and `projectIdeas`.
  The app subscribes with `onSnapshot`, so admin edits reach the kiosk in
  near real time.
- **Firebase Authentication** (Google provider) protects the admin dashboard.
- **Cost:** the Spark (free) tier comfortably covers a single-site deployment
  of this size. No other paid services are used.
- If Firestore is unreachable the app falls back to seeded starter data and
  warns staff that edits will not sync (the app is online-first by design).

## Q4 — Inventory handover format

Preferred: **CSV or Google Sheets export** with columns
`name, description, quantity, unit, area, category, storage, supplier`.
The seeding script (`scripts/seedFirestoreMaterials.ts`) uploads the parsed
list into Firestore; `src/utils/materialDetails.ts` handles the structured
fields from the existing partial inventory dump.

## Q5 — Unanswerable queries

`answerMakerQuery` returns an `unknown` intent whose answer tells the child
to ask a staff member, plus suggested prompts showing what the bot *can* do.

## Non-functional requirements mapping

| Requirement | Where it is met |
|---|---|
| Android + iPad | Web build runs in any tablet browser; Tauri for kiosk devices |
| Online-only, cloud data | Firestore; no offline mode |
| < 3 s responses | Local rule-based matching, no network round-trip per answer |
| English only | Child UI is English; staff UI has optional extra languages |
| ≥ 14pt child-facing text | Kiosk body text 16px+, labels 14px+ |
| No child login / no personal data | Kiosk collects nothing; only staff authenticate |
| Scalability without code changes | All content is data in Firestore, managed from Admin View |
