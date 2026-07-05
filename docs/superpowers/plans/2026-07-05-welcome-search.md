# Welcome Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Welcome screen search surface matching inventory materials, starting with `HDMI` returning `HDMI Cable`.

**Architecture:** Add a small pure material-search helper, reuse the existing User View materials list as the search result surface, and route Welcome search submissions through the app shell. Because `UserViewTab` currently stores a fixed React element in `content`, the app shell should replace or create the User View tab with a new `UserViewTab(initialMaterialSearch)` when a Welcome search is submitted.

**Tech Stack:** React 19, TypeScript, Vite, Electron, `tsx` for lightweight TypeScript helper tests, existing class-based `Tab` abstraction.

## Global Constraints

- Search focuses on materials only.
- Room/area search is out of scope.
- Fuzzy search is out of scope.
- Advanced ranking is out of scope.
- Search must trim leading/trailing whitespace.
- Search must match material names case-insensitively.
- Search must support partial material names, so `HDMI` matches `HDMI Cable`.
- No-result searches must show `No materials found for "<query>"` where material cards normally appear.
- Empty searches must not cause errors or confusing navigation.
- Do not implement inventory add/edit/delete in this plan.
- Do not implement Docs, Settings, or 3D map behavior in this plan.

---

## File Structure

- Create `src/utils/materialSearch.ts`: pure helper functions for normalizing material search queries and filtering materials by material name.
- Create `src/utils/materialSearch.test.ts`: no-framework test script that validates exact matching rules with Node `assert`.
- Modify `src/components/UserView.tsx`: accept `initialTab` and `initialMaterialSearch`, use the helper for filtering, and render the no-results empty state.
- Modify `src/components/UserViewTab.tsx`: accept an optional initial search query and construct `UserView` with `initialTab="materials"` when a query is present.
- Modify `src/app.tsx`: add `handleMaterialSearch(query: string)`, pass it to the Welcome tab props, and wire the Welcome search input Enter key to this handler.

Known unrelated risk: `src/components/AdminViewTab.tsx` has a previously observed duplicate default export. If `npm run build` fails on that file, record it as an unrelated pre-existing blocker and verify this plan with the helper test plus manual app behavior.

---

### Task 1: Material Search Helper

**Files:**
- Create: `src/utils/materialSearch.ts`
- Create: `src/utils/materialSearch.test.ts`

**Interfaces:**
- Produces: `normalizeMaterialSearchQuery(query: string): string`
- Produces: `filterMaterialsBySearch(materials: Material[], query: string): Material[]`
- Consumes: `Material` from `src/types.ts`

- [ ] **Step 1: Create the failing helper test**

Create `src/utils/materialSearch.test.ts` with this content:

```ts
import assert from "node:assert/strict";
import type { Material } from "../types";
import {
    filterMaterialsBySearch,
    normalizeMaterialSearchQuery,
} from "./materialSearch";

const materials: Material[] = [
    {
        id: "mat-1",
        name: "HDMI Cable",
        description: "2m HDMI cable",
        quantity: 12,
        unit: "pcs",
        compartmentId: "comp-101",
        createdAt: "2026-07-05T00:00:00.000Z",
    },
    {
        id: "mat-2",
        name: "Laptop",
        description: "Dell Latitude Laptop",
        quantity: 5,
        unit: "units",
        compartmentId: "comp-102",
        createdAt: "2026-07-05T00:00:00.000Z",
    },
    {
        id: "mat-3",
        name: "Ethernet Cable",
        description: "Cat 6 networking cable",
        quantity: 0,
        unit: "pcs",
        compartmentId: "comp-202",
        createdAt: "2026-07-05T00:00:00.000Z",
    },
];

assert.equal(normalizeMaterialSearchQuery("  HDMI  "), "hdmi");

assert.deepEqual(
    filterMaterialsBySearch(materials, "HDMI").map(material => material.name),
    ["HDMI Cable"]
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "hdmi").map(material => material.name),
    ["HDMI Cable"]
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "Cable").map(material => material.name),
    ["HDMI Cable", "Ethernet Cable"]
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "Latitude").map(material => material.name),
    []
);

assert.deepEqual(
    filterMaterialsBySearch(materials, "   ").map(material => material.name),
    ["HDMI Cable", "Laptop", "Ethernet Cable"]
);

console.log("materialSearch tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx tsx src/utils/materialSearch.test.ts
```

Expected: FAIL with a module resolution error because `src/utils/materialSearch.ts` does not exist yet.

- [ ] **Step 3: Create the material search helper**

Create `src/utils/materialSearch.ts` with this content:

```ts
import type { Material } from "../types";

export function normalizeMaterialSearchQuery(query: string): string {
    return query.trim().toLowerCase();
}

export function filterMaterialsBySearch(
    materials: Material[],
    query: string
): Material[] {
    const normalizedQuery = normalizeMaterialSearchQuery(query);

    if (!normalizedQuery) {
        return materials;
    }

    return materials.filter(material =>
        material.name.toLowerCase().includes(normalizedQuery)
    );
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run:

```bash
npx tsx src/utils/materialSearch.test.ts
```

Expected:

```text
materialSearch tests passed
```

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add src/utils/materialSearch.ts src/utils/materialSearch.test.ts
git commit -m "test: add material search helper"
```

Expected: commit succeeds and includes only the helper and helper test.

---

### Task 2: User View Search State and Empty State

**Files:**
- Modify: `src/components/UserView.tsx`

**Interfaces:**
- Consumes: `filterMaterialsBySearch(materials: Material[], query: string): Material[]` from `src/utils/materialSearch.ts`
- Produces: optional `UserViewProps.initialTab?: "map" | "materials"`
- Produces: optional `UserViewProps.initialMaterialSearch?: string`

- [ ] **Step 1: Update imports**

In `src/components/UserView.tsx`, replace the first import block:

```ts
import { useState } from 'react';
```

with:

```ts
import { useState } from 'react';
import { filterMaterialsBySearch } from '../utils/materialSearch';
```

- [ ] **Step 2: Extend `UserViewProps`**

In `src/components/UserView.tsx`, replace the `UserViewProps` interface with:

```ts
interface UserViewProps {
    floors: FloorData[];
    materials: Material[];
    requests: MaterialRequest[];
    onSubmitRequest: (materialId: string, quantity: number, reason: string) => void;
    prefs?: UserPrefs;
    initialTab?: UserTab;
    initialMaterialSearch?: string;
}
```

- [ ] **Step 3: Add an empty-state style**

In `src/components/UserView.tsx`, inside the `styles` object after the `grid` entry, add:

```ts
    emptyState: {
        padding: 20,
        border: '1px dashed #d1d5db',
        borderRadius: 12,
        color: '#6b7280',
        background: '#f9fafb',
        fontSize: 14
    },
```

- [ ] **Step 4: Initialize active tab and search from props**

In `src/components/UserView.tsx`, replace the function signature and first two state declarations:

```ts
export function UserView({
                             floors,
                             materials,
                             requests,
                             onSubmitRequest,
                             prefs
                         }: UserViewProps) {
    const [activeTab, setActiveTab] = useState<UserTab>('map');
    const [search, setSearch] = useState('');
```

with:

```ts
export function UserView({
                             floors,
                             materials,
                             requests,
                             onSubmitRequest,
                             prefs,
                             initialTab = 'map',
                             initialMaterialSearch = ''
                         }: UserViewProps) {
    const [activeTab, setActiveTab] = useState<UserTab>(initialTab);
    const [search, setSearch] = useState(initialMaterialSearch);
```

- [ ] **Step 5: Use the helper for material filtering**

In `src/components/UserView.tsx`, replace:

```ts
    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
    );
```

with:

```ts
    const filteredMaterials = filterMaterialsBySearch(materials, search);
    const hasMaterialSearch = search.trim().length > 0;
```

- [ ] **Step 6: Render the no-results state**

In `src/components/UserView.tsx`, inside the materials section, replace the whole material grid block:

```tsx
                    <div style={styles.grid}>
                        {filteredMaterials.map(m => {
                            const empty = m.quantity <= 0;

                            return (
                                <div key={m.id} style={styles.card(empty)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>{m.name}</strong>
                                        <span>{empty ? 'Out' : m.quantity}</span>
                                    </div>

                                    <button
                                        style={styles.btnPrimary}
                                        onClick={() => setRequesting(m)}
                                        disabled={empty}
                                    >
                                        <Send size={14} /> Request
                                    </button>
                                </div>
                            );
                        })}
                    </div>
```

with:

```tsx
                    {filteredMaterials.length > 0 ? (
                        <div style={styles.grid}>
                            {filteredMaterials.map(m => {
                                const empty = m.quantity <= 0;

                                return (
                                    <div key={m.id} style={styles.card(empty)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong>{m.name}</strong>
                                            <span>{empty ? 'Out' : m.quantity}</span>
                                        </div>

                                        <button
                                            style={styles.btnPrimary}
                                            onClick={() => setRequesting(m)}
                                            disabled={empty}
                                        >
                                            <Send size={14} /> Request
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={styles.emptyState}>
                            {hasMaterialSearch
                                ? `No materials found for "${search.trim()}"`
                                : 'No materials available'}
                        </div>
                    )}
```

- [ ] **Step 7: Run the helper test**

Run:

```bash
npx tsx src/utils/materialSearch.test.ts
```

Expected:

```text
materialSearch tests passed
```

- [ ] **Step 8: Optional compile check**

Run:

```bash
npm run build
```

Expected if there are no unrelated blockers: Vite build completes successfully.

Expected if the known duplicate export still exists: build may fail in `src/components/AdminViewTab.tsx`. Treat that as unrelated to this task and do not include a fix in this commit.

- [ ] **Step 9: Commit Task 2**

Run:

```bash
git add src/components/UserView.tsx
git commit -m "feat: support initial material search in user view"
```

Expected: commit succeeds and includes only `src/components/UserView.tsx`.

---

### Task 3: Welcome Search Routing

**Files:**
- Modify: `src/components/UserViewTab.tsx`
- Modify: `src/app.tsx`

**Interfaces:**
- Consumes: `UserViewProps.initialTab?: "map" | "materials"` from Task 2
- Consumes: `UserViewProps.initialMaterialSearch?: string` from Task 2
- Produces: `new UserViewTab(initialMaterialSearch?: string)`
- Produces: `BasicTabProps.handleMaterialSearch(query: string): void`

- [ ] **Step 1: Update `UserViewTab` constructor**

In `src/components/UserViewTab.tsx`, replace the `content` class field:

```tsx
    content: React.ReactNode = (
        <UserView
            floors={this.floors}
            materials={this.materials}
            requests={this.requests}
            onSubmitRequest={(materialId, quantity, reason) => {
                console.log("Request submitted:", {
                    materialId,
                    quantity,
                    reason,
                });
            }}
            prefs={{
                hideOutOfStock: false,
                compactCards: false,
            }}
        />
    );
```

with:

```tsx
    content: React.ReactNode;

    constructor(initialMaterialSearch: string = "") {
        this.content = (
            <UserView
                floors={this.floors}
                materials={this.materials}
                requests={this.requests}
                initialTab={initialMaterialSearch.trim() ? "materials" : "map"}
                initialMaterialSearch={initialMaterialSearch}
                onSubmitRequest={(materialId, quantity, reason) => {
                    console.log("Request submitted:", {
                        materialId,
                        quantity,
                        reason,
                    });
                }}
                prefs={{
                    hideOutOfStock: false,
                    compactCards: false,
                }}
            />
        );
    }
```

- [ ] **Step 2: Extend `BasicTabProps`**

In `src/app.tsx`, replace the `BasicTabProps` type:

```ts
export type BasicTabProps = {
    tabs: Tab[];
    setTabs: (tabs: Tab[]) => void;
    tabIndex: number;
    setTabIndex: (index: number) => void;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
    handleClosingTab: (index: number) => void;
}
```

with:

```ts
export type BasicTabProps = {
    tabs: Tab[];
    setTabs: (tabs: Tab[]) => void;
    tabIndex: number;
    setTabIndex: (index: number) => void;
    handleNewTab: () => number;
    setTab: (index: number, tab: Tab) => void;
    handleClosingTab: (index: number) => void;
    handleMaterialSearch: (query: string) => void;
}
```

- [ ] **Step 3: Wire the Welcome search input**

In `src/app.tsx`, locate the Welcome screen `<input type="search" ... />` and add this prop before `style={...}`:

```tsx
                        onKeyDown={(event) => {
                            if (event.key !== "Enter") {
                                return;
                            }

                            welcomeTab.props.handleMaterialSearch(event.currentTarget.value);
                        }}
```

The resulting input start should look like:

```tsx
                    <input
                        type="search"
                        placeholder="Search..."
                        onKeyDown={(event) => {
                            if (event.key !== "Enter") {
                                return;
                            }

                            welcomeTab.props.handleMaterialSearch(event.currentTarget.value);
                        }}
                        style={{
                            width: "100%",
```

- [ ] **Step 4: Add the app-level search handler**

In `src/app.tsx`, inside `function App()`, after the `setTab` function, add:

```ts
    const handleMaterialSearch = (query: string) => {
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            return;
        }

        setTabs((prevTabs) => {
            const existingIndex = prevTabs.findIndex(tab => tab.name === "User View");
            const searchedUserViewTab = new UserViewTab(trimmedQuery);

            if (existingIndex !== -1) {
                const updatedTabs = [...prevTabs];
                updatedTabs[existingIndex] = searchedUserViewTab;
                setTabIndex(existingIndex);
                return updatedTabs;
            }

            setTabIndex(prevTabs.length);
            return [...prevTabs, searchedUserViewTab];
        });
    }
```

- [ ] **Step 5: Pass `handleMaterialSearch` into `welcomeTab.SetProps`**

In `src/app.tsx`, replace the `welcomeTab.SetProps` call's second argument:

```ts
        {
            tabs,
            setTabs,
            tabIndex,
            setTabIndex,
            handleNewTab,
            setTab,
            handleClosingTab
        }
```

with:

```ts
        {
            tabs,
            setTabs,
            tabIndex,
            setTabIndex,
            handleNewTab,
            setTab,
            handleClosingTab,
            handleMaterialSearch
        }
```

- [ ] **Step 6: Pass `handleMaterialSearch` into `HelpCommand.receive`**

In `src/app.tsx`, replace the `HelpCommand.receive` argument:

```ts
    HelpCommand.receive({
        tabs,
        setTabs,
        tabIndex,
        setTabIndex,
        handleNewTab,
        setTab,
        handleClosingTab
    })
```

with:

```ts
    HelpCommand.receive({
        tabs,
        setTabs,
        tabIndex,
        setTabIndex,
        handleNewTab,
        setTab,
        handleClosingTab,
        handleMaterialSearch
    })
```

- [ ] **Step 7: Run the helper test**

Run:

```bash
npx tsx src/utils/materialSearch.test.ts
```

Expected:

```text
materialSearch tests passed
```

- [ ] **Step 8: Manual app verification**

Run:

```bash
npm run dev
```

Expected: Vite starts and prints a local URL such as `http://localhost:5173/`.

Then open the app in the existing Electron/dev flow used by the project. On the Welcome screen:

1. Type `HDMI`.
2. Press Enter.
3. Confirm the `User View` tab becomes active.
4. Confirm the `materials` sub-tab is active.
5. Confirm `HDMI Cable` is visible.
6. Return to Welcome and search `unknown-material`.
7. Confirm the `User View` materials area shows `No materials found for "unknown-material"`.
8. Return to Welcome, submit an empty search, and confirm no crash or confusing navigation occurs.

- [ ] **Step 9: Optional compile check**

Run:

```bash
npm run build
```

Expected if there are no unrelated blockers: Vite build completes successfully.

Expected if the known duplicate export still exists: build may fail in `src/components/AdminViewTab.tsx`. Treat that as unrelated to this task and do not include a fix in this commit.

- [ ] **Step 10: Commit Task 3**

Run:

```bash
git add src/components/UserViewTab.tsx src/app.tsx
git commit -m "feat: route welcome material search to user view"
```

Expected: commit succeeds and includes only `src/components/UserViewTab.tsx` and `src/app.tsx`.

---

## Final Verification

- [ ] Run:

```bash
npx tsx src/utils/materialSearch.test.ts
```

Expected:

```text
materialSearch tests passed
```

- [ ] Run:

```bash
npm run dev
```

Expected: development server starts.

- [ ] Manually verify:

```text
Welcome search "HDMI" -> User View materials -> HDMI Cable is visible.
Welcome search "hdmi" -> User View materials -> HDMI Cable is visible.
Welcome search "Cable" -> User View materials -> HDMI Cable and Ethernet Cable are visible.
Welcome search "not-real" -> User View materials -> No materials found for "not-real".
Welcome empty search -> app remains stable.
```

- [ ] Run:

```bash
git status --short
```

Expected: no uncommitted changes from this plan.

---

## Self-Review

Spec coverage:

- Material-only scope is implemented by `filterMaterialsBySearch`.
- Trim/case-insensitive/partial matching is implemented in Task 1.
- Welcome submission is implemented in Task 3.
- User View materials result surface is implemented in Task 2 and Task 3.
- No-results state is implemented in Task 2.
- Empty search stability is implemented in Task 3 by returning early.

Placeholder scan:

- No unresolved placeholders are present.

Type consistency:

- `filterMaterialsBySearch(materials: Material[], query: string): Material[]` is defined in Task 1 and consumed in Task 2.
- `initialTab?: UserTab` and `initialMaterialSearch?: string` are defined in Task 2 and consumed in Task 3.
- `handleMaterialSearch(query: string): void` is defined in Task 3 and passed through `BasicTabProps`.
