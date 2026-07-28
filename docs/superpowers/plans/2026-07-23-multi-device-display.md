# Multi-Device Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the same deployed app as three device experiences — TV (fullscreen rotating display), tablet (locked kiosk), and laptop (normal app) — selected by a URL query param.

**Architecture:** A pure `resolveDisplayMode()` reads `?display=` at startup. `app.tsx` branches inside the existing `InventoryProvider`: `tv` → `<TvDisplay>`, `kiosk` → bare `<MakerKiosk>`, else the current tabbed shell. `TvDisplay` cycles through scenes using a pure `nextScene()` rotation helper. All modes are read-only and reuse existing components (`MakerKiosk`, `RoomMap`) and live data via `useInventory()`.

**Tech Stack:** Vite + React 19, TypeScript, Firebase (read-only here), plain `node:assert/strict` + `tsx` tests.

## Global Constraints

- Tests: plain `node:assert/strict`, run via `tsx` (`npm test` globs `*.test.ts`/`*.test.tsx`). Testable logic must be pure and must NOT import `firebaseApp` or anything that initializes Firebase.
- No new dependencies.
- Display modes are read-only — no Firestore writes.
- Unknown/missing `?display=` value MUST resolve to `normal` (never error).
- The Tauri desktop shell has no `?display=` param and MUST keep rendering `normal`.

---

### Task 1: Display-mode resolver

**Files:**
- Create: `src/utils/displayMode.ts`
- Test: `src/utils/displayMode.test.ts`

**Interfaces:**
- Produces: `type DisplayMode = 'normal' | 'tv' | 'kiosk'` and `resolveDisplayMode(search?: string): DisplayMode`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/displayMode.test.ts
import assert from "node:assert/strict";
import { resolveDisplayMode } from "./displayMode.ts";

assert.equal(resolveDisplayMode("?display=tv"), "tv");
assert.equal(resolveDisplayMode("?display=kiosk"), "kiosk");
assert.equal(resolveDisplayMode("?display=normal"), "normal");
assert.equal(resolveDisplayMode(""), "normal", "empty search is normal");
assert.equal(resolveDisplayMode("?foo=bar"), "normal", "missing param is normal");
assert.equal(resolveDisplayMode("?display=banana"), "normal", "unknown value is normal");
assert.equal(resolveDisplayMode("?display=TV"), "tv", "value is case-insensitive");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/utils/displayMode.test.ts`
Expected: FAIL — cannot find module `./displayMode.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/utils/displayMode.ts
export type DisplayMode = "normal" | "tv" | "kiosk";

export function resolveDisplayMode(
    search: string = typeof window !== "undefined" ? window.location.search : "",
): DisplayMode {
    const value = new URLSearchParams(search).get("display")?.toLowerCase();
    if (value === "tv" || value === "kiosk") {
        return value;
    }
    return "normal";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/utils/displayMode.test.ts`
Expected: PASS (no output, exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/utils/displayMode.ts src/utils/displayMode.test.ts
git commit -m "feat: add display-mode URL resolver"
```

---

### Task 2: Scene rotation helper

**Files:**
- Create: `src/utils/sceneRotation.ts`
- Test: `src/utils/sceneRotation.test.ts`

**Interfaces:**
- Produces: `type SceneId = 'ambient' | 'roomMap' | 'kioskMirror' | 'voting'`, `TV_SCENES: SceneId[]` (the default enabled order), `TV_ROTATION_MS: number`, and `nextScene(current: SceneId, enabled: SceneId[]): SceneId`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/sceneRotation.test.ts
import assert from "node:assert/strict";
import { nextScene, TV_SCENES, type SceneId } from "./sceneRotation.ts";

assert.deepEqual(TV_SCENES, ["ambient", "roomMap", "kioskMirror", "voting"]);

assert.equal(nextScene("ambient", TV_SCENES), "roomMap");
assert.equal(nextScene("voting", TV_SCENES), "ambient", "wraps to first");

const single: SceneId[] = ["ambient"];
assert.equal(nextScene("ambient", single), "ambient", "single scene stays");

assert.equal(
    nextScene("voting", ["ambient", "roomMap"]),
    "ambient",
    "current not in enabled list restarts at first",
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/utils/sceneRotation.test.ts`
Expected: FAIL — cannot find module `./sceneRotation.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/utils/sceneRotation.ts
export type SceneId = "ambient" | "roomMap" | "kioskMirror" | "voting";

export const TV_SCENES: SceneId[] = ["ambient", "roomMap", "kioskMirror", "voting"];

export const TV_ROTATION_MS = 15_000;

export function nextScene(current: SceneId, enabled: SceneId[]): SceneId {
    if (enabled.length === 0) return current;
    const index = enabled.indexOf(current);
    if (index === -1) return enabled[0];
    return enabled[(index + 1) % enabled.length];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/utils/sceneRotation.test.ts`
Expected: PASS (no output, exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/utils/sceneRotation.ts src/utils/sceneRotation.test.ts
git commit -m "feat: add TV scene rotation helper"
```

---

### Task 3: TvDisplay component with scenes

**Files:**
- Create: `src/components/TvDisplay.tsx`
- Create: `src/components/tvDisplay.css`

**Interfaces:**
- Consumes: `nextScene`, `TV_SCENES`, `TV_ROTATION_MS`, `SceneId` (Task 2); `useInventory()` from `./InventoryProvider`; `RoomMap` from `./RoomMap`; `MakerKiosk` from `./MakerKiosk`.
- Produces: `export function TvDisplay(): JSX.Element` (default export too).

This task is visually verified (no unit test — matches how the project treats presentational components). It MUST render inside `InventoryProvider` (the caller in Task 4 guarantees this).

- [ ] **Step 1: Create `src/components/tvDisplay.css`**

```css
.tv-root {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--background, #0b0b0f);
    color: var(--foreground, #f5f5f7);
    font-size: clamp(20px, 2.2vw, 40px);
    overflow: hidden;
}
.tv-scene {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 3vmin 4vmin;
    gap: 2vmin;
}
.tv-scene--map { padding: 0; }
.tv-title { font-size: clamp(32px, 4vw, 72px); font-weight: 700; }
.tv-card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2vmin; }
.tv-card {
    background: var(--card, rgba(255,255,255,0.06));
    border-radius: 2vmin;
    padding: 2vmin 2.5vmin;
}
.tv-dots { display: flex; gap: 1.2vmin; justify-content: center; padding: 1.5vmin; }
.tv-dot { width: 1.4vmin; height: 1.4vmin; border-radius: 50%; background: rgba(255,255,255,0.25); }
.tv-dot--active { background: var(--primary, #7c5cff); }
.tv-fullscreen-hint {
    position: fixed; top: 2vmin; right: 2vmin;
    font-size: 14px; opacity: 0.6; cursor: pointer;
    background: rgba(0,0,0,0.4); padding: 8px 12px; border-radius: 8px;
}
```

- [ ] **Step 2: Create `src/components/TvDisplay.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useInventory } from "./InventoryProvider";
import { RoomMap } from "./RoomMap";
import { MakerKiosk } from "./MakerKiosk";
import { nextScene, TV_SCENES, TV_ROTATION_MS, type SceneId } from "../utils/sceneRotation";
import "./tvDisplay.css";

function AmbientScene() {
    const { makerItems, projectIdeas } = useInventory();
    const tools = makerItems.filter(i => i.type === "tool").slice(0, 4);
    const ideas = projectIdeas.slice(0, 4);
    return (
        <div className="tv-scene">
            <div className="tv-title">Welcome to the VIVITA Makerspace</div>
            <div className="tv-card-grid">
                <div className="tv-card">
                    <strong>Tools available</strong>
                    <ul>{tools.map(t => <li key={t.name}>{t.name}</li>)}</ul>
                </div>
                <div className="tv-card">
                    <strong>Try making</strong>
                    <ul>{ideas.map(p => <li key={p.title}>{p.title}</li>)}</ul>
                </div>
            </div>
            <div className="tv-card">Remember: ask an adult before using tools marked for supervision.</div>
        </div>
    );
}

function RoomMapScene() {
    const { floors, materials } = useInventory();
    return (
        <div className="tv-scene tv-scene--map">
            <RoomMap floors={floors} materials={materials} />
        </div>
    );
}

function KioskMirrorScene() {
    return (
        <div className="tv-scene">
            <MakerKiosk />
        </div>
    );
}

function VotingScene() {
    return (
        <div className="tv-scene">
            <div className="tv-title">Voting games</div>
            <div className="tv-card">Coming soon — vote from your tablet.</div>
        </div>
    );
}

const SCENE_COMPONENTS: Record<SceneId, () => JSX.Element> = {
    ambient: AmbientScene,
    roomMap: RoomMapScene,
    kioskMirror: KioskMirrorScene,
    voting: VotingScene,
};

export function TvDisplay() {
    const [scene, setScene] = useState<SceneId>(TV_SCENES[0]);

    useEffect(() => {
        const timer = setInterval(() => {
            setScene(current => nextScene(current, TV_SCENES));
        }, TV_ROTATION_MS);
        return () => clearInterval(timer);
    }, []);

    const requestFullscreen = () => {
        document.documentElement.requestFullscreen?.().catch(() => {});
    };

    const SceneComponent = SCENE_COMPONENTS[scene];

    return (
        <div className="tv-root">
            <div className="tv-fullscreen-hint" onClick={requestFullscreen}>Tap for fullscreen</div>
            <SceneComponent />
            <div className="tv-dots">
                {TV_SCENES.map(id => (
                    <div key={id} className={id === scene ? "tv-dot tv-dot--active" : "tv-dot"} />
                ))}
            </div>
        </div>
    );
}

export default TvDisplay;
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (If `useInventory` does not export `type` members used here, import the concrete values only — `makerItems`, `projectIdeas`, `floors`, `materials` are runtime fields, no type import needed.)

- [ ] **Step 4: Commit**

```bash
git add src/components/TvDisplay.tsx src/components/tvDisplay.css
git commit -m "feat: add TvDisplay with rotating scenes"
```

---

### Task 4: Wire display modes into app.tsx

**Files:**
- Modify: `src/app.tsx` (imports near top; the `App` component's `return`, currently `InventoryProvider` wraps `<main>` at lines ~910-957)

**Interfaces:**
- Consumes: `resolveDisplayMode` (Task 1), `TvDisplay` (Task 3), `MakerKiosk` (existing `./components/MakerKiosk`).

- [ ] **Step 1: Add imports near the other component imports**

```tsx
import { resolveDisplayMode } from "./utils/displayMode";
import TvDisplay from "./components/TvDisplay";
import { MakerKiosk } from "./components/MakerKiosk";
```

- [ ] **Step 2: Resolve the mode once at the top of `App()`**

Add near the other `useState` calls in `App()`:

```tsx
const [displayMode] = useState(() => resolveDisplayMode());
```

- [ ] **Step 3: Branch the render inside `InventoryProvider`**

Locate the `return (` in `App()` whose first child is `<InventoryProvider>` wrapping `<main …>`. Insert the branch as the first children of `InventoryProvider`, keeping the existing `<main>` block as the `normal` arm:

```tsx
return (
    <InventoryProvider>
        {displayMode === "tv" ? (
            <TvDisplay />
        ) : displayMode === "kiosk" ? (
            <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column" }}>
                <MakerKiosk />
            </div>
        ) : (
            <main /* ...existing props unchanged... */>
                {/* ...existing children unchanged... */}
            </main>
        )}
    </InventoryProvider>
);
```

Do not alter the `<main>` element's existing props or children — only wrap it in the ternary's `normal` arm.

- [ ] **Step 4: Type-check and run the full test suite**

Run: `npx tsc --noEmit && npm test`
Expected: type-check clean; all tests pass (existing + Tasks 1-2).

- [ ] **Step 5: Manual verification (build + preview)**

Run: `npm run build && npm run preview`
Then open in a browser:
- `http://localhost:4173/` → normal tabbed app (unchanged).
- `http://localhost:4173/?display=kiosk` → Maker Bot only, no titlebar/tabs.
- `http://localhost:4173/?display=tv` → fullscreen display that rotates ambient → room map → kiosk mirror → voting every 15s, with dot indicators.

- [ ] **Step 6: Commit**

```bash
git add src/app.tsx
git commit -m "feat: branch app into tv/kiosk/normal display modes"
```

---

### Task 5: Responsive polish for tablet and TV

**Files:**
- Modify: `src/style.css` (append a small responsive block; do not edit unrelated rules)

**Interfaces:** none (CSS only).

- [ ] **Step 1: Append responsive rules to `src/style.css`**

```css
/* Tablet: give touch targets room and let the tab shell breathe on narrow/portrait screens */
@media (max-width: 900px) {
    .tab-bar, [class*="tabBar"] { overflow-x: auto; }
    button { min-height: 40px; }
}

/* Coarse pointer (touch tablets/kiosks): larger hit areas */
@media (pointer: coarse) {
    button, a, [role="button"] { min-height: 44px; }
}
```

If the class names above do not exist in the codebase, keep only the element/media-feature rules (`button`, `pointer: coarse`) and drop the class selectors — do not invent class names.

- [ ] **Step 2: Manual verification**

Run: `npm run build && npm run preview`
Resize the browser narrow (tablet width) on `http://localhost:4173/` and confirm the tab bar scrolls rather than overflowing, and buttons remain comfortably tappable.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: responsive polish for tablet and touch kiosks"
```

---

## Self-Review

- **Spec coverage:** Display modes (Task 1, 4) ✓; TvDisplay + 4 scenes incl. voting placeholder (Task 3) ✓; live data via `useInventory` (Task 3) ✓; responsive CSS normal + TV (Task 3 CSS, Task 5) ✓; testing of pure units (Tasks 1-2) ✓; out-of-scope voting logic left as placeholder ✓.
- **Placeholder scan:** none — all steps carry real code/commands.
- **Type consistency:** `DisplayMode`, `SceneId`, `nextScene`, `TV_SCENES`, `TV_ROTATION_MS` used identically across Tasks 1-4; `RoomMap` props (`floors`, `materials`) match its `RoomMapProps`; `MakerKiosk` and `useInventory` imported as they are exported today.
