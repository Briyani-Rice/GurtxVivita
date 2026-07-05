# Vivita Shell Rebrand — Design

## Context

Viventory (this Electron + React app) currently has no cohesive visual identity: the app shell (`app.tsx`, `titlebar.tsx`, `titlestyle.css`) uses raw inline styles and ad-hoc hex colors, and a separate Tailwind/shadcn design-token system (`src/theme.css`, plus the full `src/components/ui/*` library) exists but is never actually loaded, because `index.html` references it via an invalid `<style href="...">` tag instead of `<link rel="stylesheet">`.

The organization has a real marketing site at https://vivita.sg with an established brand: monochrome black/white, a bold angular geometric wordmark ("VIVITA"), hand-drawn doodle illustrations (e.g. paper airplane → hot air balloon), Inter (body) + Oswald (display) typefaces, generous whitespace, and youth/STEM-empowerment messaging.

Goal: bring the app's shared shell chrome (titlebar, tab bar, welcome screen, global design tokens) in line with that brand, without touching the internals of feature tabs (Admin, Room Map, Chatbot, Settings, Login).

## Scope

**In scope:**
- Fixing the broken CSS loading pipeline so `theme.css` tokens actually apply app-wide.
- Updating brand tokens in `theme.css`: fonts (Inter/Oswald, self-hosted), color palette (monochrome base + kept teal accent `#3b83a3`).
- Consolidating the duplicate token sources in `style.css` into `theme.css`.
- Swapping placeholder brand assets (wordmark, favicon mark) pulled from vivita.sg into `public/`.
- Rebuilding the `welcomeTab` content using Tailwind + existing shadcn `Button`/`Input` components instead of inline styles, including one doodle-illustration accent.
- Reskinning `RenderTabBar` / `RenderTabBarTab` / `Titlebar` in `app.tsx` and `titlestyle.css` to use the theme tokens instead of inline hex values.

**Out of scope:**
- Admin, Room Map / Floor Plan Editor, Chatbot, Docs, Settings, Login screens — their internal content and logic are untouched. They inherit new fonts/colors automatically once the token pipeline is fixed, but no dedicated redesign work happens there.
- Any restructuring of the tab-browser navigation paradigm (confirmed: keep closable/draggable tabs, not a fixed top nav).
- Official brand asset sourcing — placeholder assets pulled from the live site are used; swapping in final official files is a follow-up if they differ.

## Design

### 1. Fix the design-token pipeline

`index.html` currently has:
```html
<style href="/src/titlestyle.css" rel="stylesheet"></style>
<style href="/src/theme.css" rel="stylesheet"></style>
```
Neither is valid HTML (`<style>` doesn't take an `href`), so `theme.css` never loads (titlestyle.css happens to load anyway because `titlebar.tsx` separately does `import "./titlestyle.css"`).

Fix: remove both `<style href>` tags from `index.html`, and add `import './theme.css'` to `src/app.tsx` alongside the existing `import './style.css'`. This mirrors the working pattern already used for `style.css` and `titlestyle.css`, keeping all CSS entry points as JS imports rather than mixing in raw HTML tags.

### 2. Brand tokens

In `theme.css`:
- Replace `--font-sans` (currently system-ui/Segoe UI stack) with the Inter stack, and `--font-display` (currently `"DM Sans"`) with the Oswald stack.
- Add `@fontsource/inter` and `@fontsource/oswald` as dependencies; import their CSS (e.g. `@fontsource/inter/400.css`, `/500.css`, `/700.css` and the Oswald equivalents) once, from `theme.css` or `app.tsx`, so the fonts are bundled and available offline in the packaged Electron app.
- Keep `--primary`/interactive accent tokens pointed at the existing teal `#3b83a3` (already the titlebar color and current welcome-page accent) rather than introducing a new brand color — per decision, this was chosen over a Vivita-style orange/yellow to avoid unnecessary new color decisions.
- Base surface tokens (`--background`, `--foreground`, `--card`, etc.) stay near-black/white as they largely already are in `theme.css`; no dark-mode work is in scope here.

`style.css` currently defines its own separate `--text`, `--bg`, `--accent`, `--accent-bg`, etc. custom properties, which is a second, conflicting source of truth from `theme.css`. These get removed from `style.css`, and any rules in `style.css` that reference them get repointed at the `theme.css` tokens instead.

### 3. Logo & marks

Two images already pulled from vivita.sg during design discussion:
- Wordmark: `logoforethan.png` (bold angular "VIVITA" wordmark, black on transparent)
- Favicon mark: `vivitafavicon.png` (black angular "V" mark)

These replace the current `GurtXVivita_Logo*` files referenced from `public/` wherever the app displays a logo (welcome screen, and the app icon reference in `package.json`'s `build.icon` / native icons if practical within this pass). Treated explicitly as placeholders — the user may swap in official brand files later without further design changes needed, since they'll drop into the same file slots.

### 4. Welcome tab redesign

`welcomeTab` in `app.tsx` currently renders a large inline-styled `<div>` with a "Viventory" heading, a black search input, and a teal footer bar with Settings/Docs buttons.

Redesign, keeping the same functional pieces (heading, search input, Settings/Docs actions) but restyled:
- Convert inline `style={{...}}` blocks to Tailwind utility classes.
- Replace the raw `<input type="search">` with the existing shadcn `Input` component (`src/components/ui/input.tsx`) and the raw footer `<button>`s with the existing shadcn `Button` component (`src/components/ui/button.tsx`), consistent with how `titlebar.tsx` already uses `Button` for its command-bar trigger.
- Use the Vivita wordmark image in place of (or alongside) the plain-text "Viventory" heading.
- Add one doodle-style illustration accent (reusing the site's paper-airplane-to-balloon line art) near the hero content for personality, matching the brand's hand-drawn illustration style. Kept to a single accent, not a redesign of the whole page into a marketing-site layout — this is an app welcome screen, not the marketing site itself.
- Base palette: white background, black text, teal accent on the primary action — consistent with the "black & white + one accent" decision.

### 5. Shell reskin (tab bar + titlebar)

`RenderTabBar` and `RenderTabBarTab` in `app.tsx` currently use inline hex values (`#dddddd` background, `#cce8f4` active tab, `#00000010` bar background, etc.) and `titlestyle.css` hardcodes `#3b83a3` for the titlebar.

Convert these to Tailwind utility classes / theme token references so tab bar and titlebar colors are driven by the same `--primary`/`--background`/`--foreground`/`--border` tokens as the rest of the app, rather than separate hardcoded values. Visual result should be equivalent to today (teal active-state highlight, light neutral inactive tabs) but sourced from one token set instead of three separate hardcoded color systems (`app.tsx` inline styles, `titlestyle.css`, `theme.css`).

## Testing

This is a styling/branding change with no new business logic, so testing is manual/visual:
- `npm run dev`: confirm the app launches, `theme.css` tokens are visibly applied (inspect computed styles / fonts in devtools), and no console errors from the font imports.
- Visually confirm: titlebar color, tab bar active/inactive states, welcome screen layout, and Settings/Docs navigation from the welcome screen footer still work.
- Confirm existing tabs (Admin, Room Map, Chatbot, Docs, Settings, Login) still render without errors — since they weren't touched directly, this is a regression check that the global token/font change didn't break anything relying on the old `style.css` variables.
- `npm run build`: confirm production build succeeds with the new font packages bundled.
