# Multi-Device Display — Design

**Date:** 2026-07-23
**Status:** Approved (design), pending implementation plan
**Scope:** Make the web app run well across TV, laptop, and tablet. This spec
covers device display modes and responsive layout **only**. Voting mini-games,
their backend API, and other "fun things" are separate future specs; this design
leaves a wired-in placeholder for the voting scene but implements no voting logic.

## Context

Viventory is a Vite + React frontend (Tauri desktop shell, Firebase backend),
now also deployed to Firebase Hosting at `gurtxvivita-4c370.web.app`. The app
uses a browser-style tab system (`app.tsx`), not URL routing — there is no
react-router. A Tauri-only fullscreen toggle exists, but the browser build has
no concept of "device modes." A `MakerKiosk` component and a `RoomMap` component
already exist and read live inventory/project data via `InventoryProvider`.

The goal: the same deployed app should serve three device contexts —
a **TV** (large, distance-viewed, untouched), a **laptop** (staff/admin), and a
**tablet** (child-facing kiosk) — across live events, permanent installs, client
demos, and showcases.

## Approach

**URL-based display modes, with responsive CSS underneath.** A device cannot be
reliably auto-detected (a 1080p TV is indistinguishable from a laptop to CSS), so
the device context is chosen explicitly by which URL is opened. Responsive CSS
still handles laptop-vs-tablet sizing within the normal mode. This was chosen
over pure auto-responsive (can't deliver a distance-readable rotating TV screen)
and over a launch-screen picker (adds friction; can be added later as a
complement if desired).

## Display Modes

`displayMode` is resolved once at startup from the URL query param `?display=`:

| URL | Mode | Renders |
|-----|------|---------|
| `…web.app` | `normal` | Existing tabbed app, responsive for laptop and tablet |
| `…web.app/?display=tv` | `tv` | Fullscreen `TvDisplay`, no titlebar/tabs |
| `…web.app/?display=kiosk` | `kiosk` | Stripped `MakerKiosk` only, no admin, no tabs |

Any unknown or missing value falls back to `normal`. Each device bookmarks its
link once. The Tauri desktop shell is unaffected and continues to render
`normal` (no `?display=` param).

## Components

### `utils/displayMode.ts`
Pure function `resolveDisplayMode(search?: string): 'normal' | 'tv' | 'kiosk'`.
Reads `window.location.search` by default; accepts an explicit string for
testing. No Firebase import (keeps it testable per the project's plain
tsx/node-assert convention).

### `app.tsx` (changed)
At the top of render, branch on `resolveDisplayMode()`:
- `tv` → `<TvDisplay>`
- `kiosk` → `<MakerKiosk>` with admin/tab chrome removed
- `normal` → existing tabbed shell (unchanged behavior)

`TvDisplay` and the kiosk branch still mount inside `InventoryProvider` so they
receive live data.

### `components/TvDisplay.tsx` (new)
Fullscreen container that auto-rotates through **scenes** on a timer
(default ~15s), with small dot indicators and a "tap for fullscreen" hint
(browsers block programmatic fullscreen without a user gesture). Scenes:

- **Ambient** — welcome message, featured project ideas, currently available
  tools, safety reminders.
- **Room map** — large, read-only reuse of `RoomMap`.
- **Kiosk mirror** — large, read-only Maker Bot view.
- **Voting** — **placeholder only** ("Voting coming soon"); wired into the
  rotation but implements no voting behavior. Filled in by the later voting spec.

Enabled scenes and rotation interval are module constants for now (admin-
configurable is deliberately out of scope — YAGNI).

### `utils/sceneRotation.ts` (new, or colocated pure helper)
Pure `nextScene(current: SceneId, enabled: SceneId[]): SceneId` advancing through
the enabled scenes cyclically. Testable in isolation, no React/DOM.

## Data Flow

TV and kiosk scenes read the **same live Firestore inventory/project data**
through the existing `InventoryProvider`. All display modes are **read-only** —
they never write. Ambient info and the room map therefore stay current
automatically. If data is unavailable, scenes reuse the existing offline-fallback
pattern (`InventoryOfflineFallback`) to show a friendly message rather than a
blank or broken screen.

## Responsive CSS

- **Normal mode:** audit the primary views so the tab shell degrades gracefully
  on tablet widths (narrow, portrait, touch) versus laptop. Use relative units
  and existing breakpoints; no layout rewrite.
- **TV mode:** scaled-up root font size, high contrast, generous spacing for
  distance readability; no reliance on hover/touch affordances.

## Error Handling

- Unknown/empty `?display=` value → `normal` (never an error state).
- Firestore data unavailable in TV/kiosk → existing offline-fallback message
  within the scene; rotation continues.
- A scene that fails to render must not crash the rotation; the container
  isolates scene render so one bad scene falls back to the next.

## Testing

- `displayMode.test.ts` — parses `tv`, `kiosk`, `normal`, unknown, and empty
  inputs.
- `sceneRotation.test.ts` — `nextScene` cycles correctly, handles single-scene
  and full lists.
- DOM and Firebase are kept out of the testable units, consistent with the
  project's existing plain tsx/node-assert test style.

## Out of Scope (explicit)

- Voting mini-games backend/API (Python or otherwise), live vote tallies,
  real-time sync. The Voting scene is a visual placeholder only.
- "Fun things" — undefined; a later spec.
- Admin-configurable TV scene selection / timing.
- Auto device detection and the launch-screen device picker (may be added later
  as a complement, not required here).
