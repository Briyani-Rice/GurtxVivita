# Agents Review Notes (Repository: /Users/sontungle/GurtxVivita)

## Scope and purpose
This document captures a focused review of the existing codebase and an onboarding-level understanding of architecture, flow, and risk areas.

## High-level architecture
- Single-page Vite + React frontend with a tabbed shell (`src/app.tsx`) that renders:
  - Welcome section
  - Room map view
  - User view
  - Admin/admin tooling and floor plan editor
  - Docs and settings flows
- State is mostly local to class-based React components, with data objects embedded as initial values rather than sourced from a shared store/API.
- Electron layer provides native shell framing:
  - BrowserWindow bootstrap and preload bridge (`electron/main.ts`, `electron/preload.ts`)
  - IPC handlers for opening resources and reading docs
- A number of components still rely on imperative patterns (class fields, manual handlers, console-only updates), which suggests the app is partially implemented or in a prototype stage.

## Critical / blocking findings
1. Duplicate default export causing immediate compile/module failure  
   - File: `src/components/AdminViewTab.tsx`  
   - Issue: two `export default AdminViewTab` declarations are present at the end of the file.  
   - Impact: syntax/module error during build, preventing module resolution and import.

2. Missing module import used by chatbot feature — *resolved*  
   - File: `src/components/Chatbot/ChatBotView.tsx` imports `../../Secrets` for `OPENROUTER_API_KEY`.  
   - Issue: `src/Secrets.ts` is gitignored, so a fresh clone had no `Secrets` module.  
   - Resolution: `src/Secrets.example.ts` is committed as a template — copy it to `src/Secrets.ts`. See [docs/openrouter-chatbot-setup.md](docs/openrouter-chatbot-setup.md).

## High-confidence findings
3. Electron security hardening gap (`nodeIntegration: true`)  
   - File: `electron/main.ts`  
   - Issue: `nodeIntegration` is enabled while relying on preload-based exposure.  
   - Impact: significantly wider renderer attack surface; if any script injection happens, renderer can access Node APIs.

4. Data mutation handlers are mostly no-ops (state changes logged only)  
   - Files:
     - `src/components/AdminViewTab.tsx` (`onAddMaterial`, `onEditMaterial`, `onDeleteMaterial`, `onApproveRequest`, `onDeclineRequest`, `onFloorsChange`)
     - `src/components/UserViewTab.tsx` (`onSubmitRequest`)
     - `src/components/FloorPlanEditorTab.tsx` (`onFloorsChange`, `onElementSelect`)
   - Issue: handlers only `console.log(...)` inputs and do not persist updates.
   - Impact: user actions appear to work in UI intent but do not affect application state or data consistency.

5. Fragmented/tab-local state model inhibits cross-screen consistency  
   - File: `src/app.tsx`  
   - Issue: top-level app constructs discrete tab instances with independent local models.
   - Impact: admin/user/map/editor tabs cannot reliably share updates; edits in one tab are not guaranteed to reflect elsewhere.

6. Docs loading flow appears inconsistent with `File` API intent  
   - File: `src/components/Docs/DocsView.tsx`  
   - Issue: `await Promise.all(fileObjects.map((file: any) => file.ready))` is used even though standard `File` objects do not expose a `ready` property.
   - Impact: brittle behavior and likely leftover debugging logic; coupled with raw Markdown file passthrough in `src/components/FileHelper.tsx`.

## Medium-confidence findings / quality risks
7. Input validation gaps in request submit path  
   - File: `src/components/UserView.tsx`  
   - Issue: request quantity is converted with `Number(...)` without validation for NaN/<=0/stock availability.
   - Impact: malformed or invalid requests can enter system.

8. Type safety bypasses and permissive types  
   - Files include `// @ts-ignore`/`//@ts-ignore` and broad `any` usage (for example `src/components/Settings/Settings.tsx`, others).
   - Impact: reduced compile-time safety and easier regressions in refactors.

## Open risks and unresolved assumptions
- Some paths in Electron production mode are hardcoded for docs/icons and may not match packaged bundle structure.
- Several features appear intentionally scaffolded (especially admin operations and settings persistence), so expected behavior may be behind a planned refactor.
- No tests are present in this review pass; behavior assertions are based on static analysis only.

## Suggested immediate priorities
1. Fix hard blockers: duplicate export and missing `Secrets` dependency (or guard/rework chatbot import).
2. Replace `nodeIntegration: true` and tighten preload exposure surface.
3. Implement real data writes in no-op handlers and introduce a shared source of truth for tab state.
4. Normalize docs loading (`ready` flow) and strengthen file content safety/validation.
5. Add request validation rules (`qty > 0`, available inventory checks, safe reset/error feedback).
