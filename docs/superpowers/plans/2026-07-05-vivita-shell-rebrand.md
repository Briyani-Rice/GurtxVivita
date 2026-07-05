# Vivita Shell Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand Viventory's app shell (titlebar, tab bar, welcome screen, global design tokens) to match Vivita's brand — monochrome base, kept teal accent (`#3b83a3`), Inter/Oswald typography — by first fixing the currently-broken Tailwind/shadcn token pipeline, then routing the shell through it.

**Architecture:** `theme.css` (Tailwind v4 + shadcn CSS variables) is the single source of design tokens. It is currently dead code because `index.html` loads it via an invalid `<style href>` tag. Fix that, layer Vivita's fonts and a `--brand-accent` token on top, delete the now-fully-superseded legacy variables/rules in `style.css`, drop in placeholder Vivita image assets, then convert `welcomeTab`, the tab bar, and the titlebar from inline hex styles to Tailwind classes and shadcn components referencing the new tokens.

**Tech Stack:** React 19 + TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui components (`src/components/ui`), `@fontsource/inter` + `@fontsource/oswald` (new), `@dnd-kit` (unchanged, drag behavior preserved), Electron (unchanged).

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-05-vivita-shell-rebrand-design.md` — every task below implements a section of it.
- **No test framework exists in this project** (no jest/vitest/testing-library in `package.json`). Verification per task is: `npm run build` (TypeScript + JSX + CSS-import compile check) plus targeted `grep`/`file`/`ls` assertions, plus a final manual visual check via `npm run dev` (this is a purely visual/branding change, per the spec's own Testing section).
- Keep the teal accent at exactly `#3b83a3` — do not introduce a new accent color.
- Keep the tab-browser navigation paradigm (draggable/closable tabs) — do not restructure to a fixed top nav.
- Out of scope, do not touch: Admin, Room Map/Floor Plan Editor, Chatbot, Docs, Settings, Login screen internals; the Electron native app icon (`package.json`'s `build.icon`, `public/nativeIcons/*.icns`/`.ico`) — that requires platform icon-generation tooling beyond an asset swap and is a follow-up, not part of this plan.
- Placeholder Vivita brand assets are pulled directly from the live site (https://vivita.sg) via `curl` in Task 4 — they are explicitly placeholders per the design spec; swapping in official files later is out of scope here.

---

### Task 1: Fix the CSS token pipeline

**Files:**
- Modify: `index.html`
- Modify: `src/app.tsx:1-6`

**Interfaces:**
- Produces: `theme.css`'s Tailwind utility classes and CSS custom properties (`--background`, `--foreground`, `--primary`, etc.) become available app-wide via `className`, for every later task to consume.

- [ ] **Step 1: Remove the invalid `<style href>` tags from `index.html`**

`index.html` currently contains:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style href="/src/titlestyle.css" rel="stylesheet"></style>
    <style href="/src/theme.css" rel="stylesheet"></style>
    <title>gurtxvivita</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/app.tsx"></script>
  </body>
</html>
```
`<style href="...">` is not valid HTML — `<style>` only takes inline CSS, it has no `href` attribute — so neither line ever loaded anything. Replace the `<head>` block with:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>gurtxvivita</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/app.tsx"></script>
  </body>
</html>
```
(`titlestyle.css` still loads fine because `src/titlebar.tsx` already does `import "./titlestyle.css"` directly — only the dead `theme.css` load needs a real fix, done in the next step.)

- [ ] **Step 2: Import `theme.css` from `app.tsx`**

In `src/app.tsx`, the top of the file currently reads:
```tsx
//@ts-ignore
import React, {useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom/client'
//@ts-ignore
import './style.css'
import Titlebar from "./titlebar"
```
Add the `theme.css` import right after `style.css`:
```tsx
//@ts-ignore
import React, {useEffect, useRef, useState} from 'react'
import ReactDOM from 'react-dom/client'
//@ts-ignore
import './style.css'
//@ts-ignore
import './theme.css'
import Titlebar from "./titlebar"
```

- [ ] **Step 3: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds (same output shape as the pre-change baseline: `dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js`, no new errors).

- [ ] **Step 4: Verify the dead tags are gone**

Run: `grep -c "style href" index.html`
Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add index.html src/app.tsx
git commit -m "fix: load theme.css design tokens (was silently dead via invalid <style href> tag)"
```

---

### Task 2: Add Vivita brand fonts and design tokens

**Files:**
- Modify: `package.json` (add `@fontsource/inter`, `@fontsource/oswald`)
- Modify: `src/app.tsx` (font CSS imports)
- Modify: `src/theme.css:4-52,91-133,215-216`

**Interfaces:**
- Consumes: `theme.css` now loads (Task 1).
- Produces: `--font-sans` = Inter stack, `--font-display` = Oswald stack; new root token `--brand-accent: #3b83a3`; new Tailwind color utilities `bg-brand-accent`, `text-brand-accent`, `border-brand-accent` (and opacity variants like `bg-brand-accent/20`); new global utility class `.vivitaFont` (`font-family: var(--font-display)`) — consumed by Task 5 and Task 6, and picked up for free by the already-existing (previously dead) `className="vivitaFont"` references in `src/components/LoginView.tsx` and `src/components/SettingsView.tsx`.

- [ ] **Step 1: Install the font packages**

Run: `npm install @fontsource/inter @fontsource/oswald`
Expected: both added under `dependencies` in `package.json` and `package-lock.json`.

- [ ] **Step 2: Import the font CSS weights in `app.tsx`**

Add these lines in `src/app.tsx`, directly after the `./theme.css` import added in Task 1:
```tsx
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/oswald/400.css'
import '@fontsource/oswald/500.css'
import '@fontsource/oswald/600.css'
import '@fontsource/oswald/700.css'
```

- [ ] **Step 3: Point `--font-sans` and `--font-display` at Inter/Oswald**

In `src/theme.css`, the `:root` block currently has (lines 7-10):
```css
  /* ── Fonts (from VivitaStyle) ── */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  --font-display: "DM Sans", sans-serif;
  --font-mono: menlo, monaco, consolas, "Lucida Console", monospace;
```
Replace with:
```css
  /* ── Fonts (Vivita brand: Inter body, Oswald display) ── */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  --font-display: "Oswald", sans-serif;
  --font-mono: menlo, monaco, consolas, "Lucida Console", monospace;
```

- [ ] **Step 4: Add the `--brand-accent` token**

Still in the `:root` block of `src/theme.css`, directly below the `--font-mono` line, add:
```css
  --brand-accent: #3b83a3;
```

- [ ] **Step 5: Expose `--brand-accent` as a Tailwind color**

In `src/theme.css`, the `@theme inline { ... }` block currently starts (lines 91-96):
```css
@theme inline {
  --font-family-sans: var(--font-sans);
  --font-family-display: var(--font-display);
  --font-family-mono: var(--font-mono);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
```
Add a new line directly after `--font-family-mono`:
```css
  --color-brand-accent: var(--brand-accent);
```

- [ ] **Step 6: Add the `.vivitaFont` utility class**

In `src/theme.css`, the `@layer base { ... }` block closes at line 215 (`}`), immediately followed by `.app-container { ... }` at line 216. Insert a new rule between them:
```css
.vivitaFont {
  font-family: var(--font-display);
}
```

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: succeeds with no "could not resolve" errors for the `@fontsource/*` imports.

- [ ] **Step 8: Manual visual check**

Run: `npm run dev`, open devtools on the running app, inspect the computed `font-family` of the titlebar's "Viventory" `<h3>` (in `src/titlebar.tsx`) — expected computed value starts with `Oswald`. Inspect `body`'s computed `font-family` — expected to start with `Inter`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/app.tsx src/theme.css
git commit -m "feat: add Vivita brand fonts (Inter/Oswald) and brand-accent token"
```

---

### Task 3: Consolidate `style.css` into the theme token system

**Files:**
- Modify: `src/style.css` (full rewrite)

**Interfaces:**
- Consumes: `--foreground`, `--background`, `--font-sans` from `theme.css` (Tasks 1-2).
- Produces: nothing new for later tasks — this is dead-code removal so there is exactly one source of truth for color/font tokens (`theme.css`).

`style.css` currently defines its own separate `--text`, `--text-h`, `--bg`, `--border`, `--code-bg`, `--accent`, `--accent-bg`, `--accent-border`, `--social-bg`, `--shadow`, `--sans`, `--heading`, `--mono` custom properties, plus rules for `#app`, `#center`, `#next-steps`, `#docs`, `#social`, `#spacer`, `.ticks`, `.hero`, `.counter`, and `h1`/`h2`/`p`. None of those IDs/classes exist anywhere in the current JSX (`grep -rln 'id="app"\|id="center"\|id="next-steps"\|id="docs"\|id="social"\|id="spacer"\|class="ticks"\|className="hero"\|counter' src` returns nothing outside `style.css`/`counter.ts` itself) — they're leftover from the commented-out Vite template markup at the top of `src/app.tsx`. The `h1`/`h2` rules are dead too: `src/app.tsx`'s only `h1`/`h2` usage (the `welcomeTab`) sets its own inline `fontSize`/`color` that already override them, and every other `h1`/`h2` in the codebase (`LoginView.tsx`, `RequestDialog.tsx`, `CompartmentDialog.tsx`, `MaterialDialog.tsx`) already carries explicit Tailwind text classes that win over a plain-element CSS rule regardless of whether it's kept. The `p { color: #000000 }` rule is equally redundant — every `<p>` in the codebase already sets its own Tailwind text-color class.

- [ ] **Step 1: Replace the full contents of `src/style.css`**

```css
:root {
  color-scheme: light dark;
  color: var(--foreground);
  background: var(--background);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  padding: 0px;
  margin: 0px;
}

body {
  margin: 0;
  background: var(--background);
}

button {
  cursor: pointer;
}

html {
  scrollbar-gutter: stable;
}

::-webkit-scrollbar {
  width: 0px;
}
```

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: succeeds (no rule in the codebase referenced the removed selectors/variables, per the `grep` check above).

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`. Confirm the app background is still white, scrollbars are still hidden, and the cursor is still a pointer over buttons — i.e. no visual regression from the removed rules.

- [ ] **Step 4: Commit**

```bash
git add src/style.css
git commit -m "refactor: remove dead style.css rules/vars superseded by theme.css tokens"
```

---

### Task 4: Add Vivita placeholder brand assets and fix the favicon

**Files:**
- Create: `public/brand/vivita-wordmark.png`
- Create: `public/brand/vivita-mark.png`
- Create: `public/brand/vivita-doodle.png`
- Modify: `index.html`

**Interfaces:**
- Produces: three static assets servable at runtime via absolute paths (Vite serves everything under `public/` at the site root):
  - `/brand/vivita-wordmark.png` — 1326×236px, black "VIVITA" wordmark on transparent background. Consumed by Task 5 (welcome screen footer).
  - `/brand/vivita-mark.png` — 256×256px, black angular "V" mark on transparent background. Used as the app favicon (this task) — also available for Task 5/6 if needed.
  - `/brand/vivita-doodle.png` — 1237×161px, black hand-drawn line-art (paper airplane → hot air balloon) on transparent background. Consumed by Task 5 (welcome screen hero accent).

- [ ] **Step 1: Create the brand assets directory and download the placeholder assets**

```bash
mkdir -p public/brand
curl -s -A "Mozilla/5.0" -o public/brand/vivita-wordmark.png https://vivita.sg/wp-content/uploads/2024/03/logoforethan.png
curl -s -A "Mozilla/5.0" -o public/brand/vivita-mark.png https://vivita.sg/wp-content/uploads/2024/05/vivitafavicon.png
curl -s -A "Mozilla/5.0" -o public/brand/vivita-doodle.png https://vivita.sg/wp-content/uploads/2024/03/Group-843.png
```

- [ ] **Step 2: Verify the downloads**

Run: `file public/brand/*.png`
Expected: all three report `PNG image data`, with `vivita-wordmark.png` at `1326 x 236`, `vivita-mark.png` at `256 x 256`, `vivita-doodle.png` at `1237 x 161`.

- [ ] **Step 3: Point the favicon link at the new mark**

In `index.html`, replace:
```html
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
with:
```html
    <link rel="icon" type="image/png" href="/brand/vivita-mark.png" />
```
(`/favicon.svg` never existed in this project — `public/` has no such file — so this was a silently-broken favicon reference; this fixes it using the new brand mark.)

- [ ] **Step 4: Verify the build bundles the new assets**

Run: `npm run build`
Expected: succeeds; `ls dist/brand/` shows the same three PNG files copied into the build output.

- [ ] **Step 5: Commit**

```bash
git add public/brand index.html
git commit -m "feat: add placeholder Vivita brand assets and fix broken favicon link"
```

---

### Task 5: Redesign the welcome tab with Vivita branding

**Files:**
- Modify: `src/app.tsx` (the `welcomeTab.loadContent()` method)

**Interfaces:**
- Consumes: `--brand-accent`/`bg-brand-accent`/`text-brand-accent` Tailwind color and `.vivitaFont` class (Task 2), `/brand/vivita-wordmark.png` and `/brand/vivita-doodle.png` (Task 4), shadcn `Input` (`src/components/ui/input.tsx`) and `Button` (`src/components/ui/button.tsx`, already imported by `titlebar.tsx` — same pattern).
- Produces: nothing new for later tasks — this is a leaf UI change.

`welcomeTab.loadContent()` in `src/app.tsx` currently renders a fully inline-styled hero (giant "Viventory" heading, black search input, teal footer bar with plain `<button>`s for Settings/Docs). Replace it with a Tailwind-classed version using the shadcn `Input`/`Button` components, the Vivita wordmark in the footer (in place of the plain "team gurt x vivita" text), and the doodle illustration as a hero accent. The functional pieces (search input, Settings navigation, Docs navigation) stay exactly the same.

- [ ] **Step 1: Add the `Input` import**

In `src/app.tsx`, add this import alongside the other component imports near the top of the file (after the `LoginTab`/`RoomMapTab`/`UserViewTab` imports):
```tsx
import {Button} from "./components/ui/button";
import {Input} from "./components/ui/input";
```

- [ ] **Step 2: Replace `welcomeTab.loadContent()`**

Replace the full method body (currently returning the `<div style={{...}}>...</div>` block) with:
```tsx
    loadContent(){
        useEffect(() => {
            document.addEventListener('keydown',(event)=>{

            })
        }, []);
        return(
            <div
                className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background px-[20%]"
                style={{
                    backgroundImage: "radial-gradient(gray 1px, transparent 1px)",
                    backgroundSize: "16px 16px"
                }}
            >
                <div className="flex flex-col items-center text-center">
                    <img
                        src="/brand/vivita-doodle.png"
                        alt=""
                        className="mb-6 h-10 w-auto opacity-70"
                    />
                    <h1 className="vivitaFont mb-8 text-[100px] font-semibold leading-none text-brand-accent">
                        Viventory
                    </h1>
                    <h2 className="vivitaFont mb-8 text-2xl font-medium text-muted-foreground">
                        Enter text below to search.
                    </h2>
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="h-[50px] w-full rounded-[20px] border-none bg-foreground px-[22px] text-[15px] font-medium text-background transition-all duration-[120ms] ease-in-out"
                    />
                </div>
                <footer className="absolute inset-x-0 bottom-0 flex h-10 items-center gap-5 bg-brand-accent px-5">
                    <img src="/brand/vivita-wordmark.png" alt="Vivita" className="h-4 w-auto brightness-0 invert" />

                    <div className="flex-1" />

                    <Button
                        variant="ghost"
                        className="h-auto gap-1.5 p-0 text-white hover:bg-transparent hover:text-white/80"
                        onClick={() => {
                            const existingIndex = welcomeTab.props.tabs.findIndex(
                                tab => tab.name === "Settings"
                            );

                            if (existingIndex !== -1) {
                                welcomeTab.props.setTabIndex(existingIndex);
                            } else {
                                const newIndex = welcomeTab.props.handleNewTab();
                                welcomeTab.props.setTab(newIndex, new Settings());
                            }
                        }}
                    >
                        <BsGearFill /> Settings
                    </Button>

                    <Button
                        variant="ghost"
                        className="h-auto gap-1.5 p-0 text-white hover:bg-transparent hover:text-white/80"
                        onClick={() => {
                            const existingIndex = welcomeTab.props.tabs.findIndex(
                                tab => tab.name === "Documentation"
                            );

                            if (existingIndex !== -1) {
                                welcomeTab.props.setTabIndex(existingIndex);
                            } else {
                                const newIndex = welcomeTab.props.handleNewTab();
                                welcomeTab.props.setTab(newIndex, new DocsView());
                            }
                        }}
                    >
                        <IoIosBook /> Docs
                    </Button>
                </footer>
            </div>)
    }
```
Note: the dot-grid background stays as an inline `style` (Tailwind has no built-in radial-dot-pattern utility without a plugin) — everything else (layout, spacing, color, typography, the search input, the footer buttons) is now Tailwind classes and shadcn components. The wordmark image uses `brightness-0 invert` so the black-on-transparent asset renders white on the teal footer bar without needing a second exported file.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds with no TypeScript/JSX errors.

- [ ] **Step 4: Manual visual check**

Run: `npm run dev`. Confirm: the welcome tab shows the doodle image, a large teal "Viventory" heading in Oswald, the search input as a black rounded pill, and a teal footer bar with the white Vivita wordmark on the left and working Settings/Docs buttons on the right (clicking each navigates to/opens that tab, same as before).

- [ ] **Step 5: Commit**

```bash
git add src/app.tsx
git commit -m "feat: redesign welcome tab with Vivita branding"
```

---

### Task 6: Reskin the tab bar and titlebar with theme tokens

**Files:**
- Modify: `src/app.tsx` (`RenderTabBarTab`, `RenderTabBar`)
- Modify: `src/titlestyle.css`

**Interfaces:**
- Consumes: `--brand-accent`/`bg-brand-accent` Tailwind color (Task 2).
- Produces: nothing new for later tasks — leaf UI change.

- [ ] **Step 1: Import `cn` in `app.tsx`**

Add near the top of `src/app.tsx`, alongside the other imports:
```tsx
import {cn} from "./components/ui/utils";
```

- [ ] **Step 2: Convert `RenderTabBarTab` to Tailwind classes**

In `src/app.tsx`, `RenderTabBarTab` currently builds a `style` object containing both the dnd-kit-required dynamic values (`transform`, `transition`) and static visual values (`width`, `padding`, `borderRadius`, `background`, etc.) and applies it via the `style` prop, with the close button also using inline styles. Replace the whole function body with:
```tsx
function RenderTabBarTab({
                             tab,
                             index,
                             onClose,
                             currentTabIndex,
                             setTabIndex
                         }: RenderTabBarTabProps) {
    const [isHovered, setIsHovered] = useState(false)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: tab.id
    })

    const dragStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={dragStyle}
            className={cn(
                "flex h-[25px] w-[180px] shrink-0 select-none items-center justify-between rounded-[10px] px-[15px] py-[5px]",
                index === currentTabIndex ? "bg-brand-accent/20" : "bg-foreground/10",
                isDragging ? "z-[1000] cursor-grabbing opacity-90" : "z-[1] cursor-grab"
            )}
            onClick={() => setTabIndex(index)}
        >
            <div
                {...listeners}
                className="flex flex-1 cursor-grab items-center overflow-hidden text-ellipsis whitespace-nowrap"
            >
                {tab.name}
            </div>

            <button
                onPointerDown={(e) => e.stopPropagation()}

                onMouseEnter={() => setIsHovered(true)}

                onMouseLeave={() => setIsHovered(false)}

                onClick={(e) => {

                    e.stopPropagation()

                    onClose(index)
                }}

                className={cn(
                    "ml-[5px] flex items-center justify-center rounded-full border-[1.5px] border-transparent p-[5px] cursor-pointer",
                    isHovered ? "bg-background/50" : "bg-transparent"
                )}
            >
                {
                    isHovered
                        ? <IoIosCloseCircle size={20} color="black" />
                        : <IoIosCloseCircleOutline size={20} color="black" />
                }
            </button>
        </div>
    )
}
```

- [ ] **Step 3: Convert `RenderTabBar`'s container and add-tab button to Tailwind classes**

In `src/app.tsx`, `RenderTabBar`'s returned JSX currently applies inline styles to the tab-strip `<div>` (`background: "#00000010"`, etc.) and the add-tab `<button>` (`background: isHovered ? "#00000025" : "transparent"`). Replace that inner block with:
```tsx
                <div
                    className="flex h-[45px] w-full items-center gap-[5px] overflow-y-hidden overflow-x-scroll rounded-none bg-foreground/5 p-[5px] [scrollbar-gutter:unset] [scrollbar-width:thin]"
                >
                    {
                        tabs.map((tab, index) => (
                            <RenderTabBarTab
                                key={tab.id}
                                tab={tab}
                                index={index}
                                onClose={onClose}
                                currentTabIndex={currentTabIndex}
                                setTabIndex={setTabIndex}
                                moveTab={moveTab}
                                tabsLength={tabs.length}
                            />
                        ))
                    }

                    <button
                        onMouseEnter={() => setIsHovered(true)}

                        onMouseLeave={() => setIsHovered(false)}

                        onClick={(e) => {

                            e.stopPropagation()

                            handleNewTab()
                        }}

                        className={cn(
                            "flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-transparent p-[5px] cursor-pointer",
                            isHovered ? "bg-foreground/10" : "bg-transparent"
                        )}
                    >
                        {
                            isHovered
                                ? <MdAddCircle size={18} color="black" />
                                : <MdAddCircleOutline size={18} color="black" />
                        }
                    </button>
                </div>
```

- [ ] **Step 4: Repoint the titlebar's hardcoded teal to the brand token**

In `src/titlestyle.css`, replace:
```css
.title {
    display: flex;
    align-items: center;
    app-region: drag;
    height: 35px;
    background-color: #3b83a3;
    color: white;
}
```
with:
```css
.title {
    display: flex;
    align-items: center;
    app-region: drag;
    height: 35px;
    background-color: var(--brand-accent);
    color: white;
}
```
(This works because `--brand-accent` is defined on `:root` in `theme.css`, which cascades to every stylesheet in the document, including `titlestyle.css`.)

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: succeeds with no TypeScript/JSX errors.

- [ ] **Step 6: Manual visual check**

Run: `npm run dev`. Confirm: the titlebar is still teal, the active tab shows a light teal tint and inactive tabs a light gray tint (visually equivalent to before), dragging tabs to reorder still works, and the tab close (✕) and new-tab (+) hover states still show their circular highlight.

- [ ] **Step 7: Commit**

```bash
git add src/app.tsx src/titlestyle.css
git commit -m "refactor: reskin tab bar and titlebar to use brand-accent token instead of hardcoded hex"
```
