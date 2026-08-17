# Kiosk Visual Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the child-facing kiosk read as a makerspace rather than an inventory system, without touching the staff tooling.

**Architecture:** An additive `--vk-*` CSS token layer scoped to a `.viventory-kiosk` class, plus four pure TypeScript modules (category identity, kid-safe description, substitute finding, avatar state) wired into `UserView`'s card grid and `MakerKiosk` behind a `kioskMode` prop. Nothing in the staff shell changes; the global `--viventory-*` palette is not edited.

**Tech Stack:** React 19, TypeScript, Vite, plain CSS custom properties, `lucide-react` (already a dependency), `tsx` + `node:assert/strict` for tests.

**Spec:** `docs/superpowers/specs/2026-08-17-kiosk-visual-identity-design.md`

## Global Constraints

- **Never edit the `--viventory-*` tokens in `src/style.css` or the `PALETTES` object in `src/components/Settings/appearancePreferences.ts`.** `src/components/VivitaPalette.test.ts` asserts every light-mode surface token is exactly `#ffffff` and that the four VIVITA site colours are present. Both must keep passing.
- The four VIVITA site colours are `#24262B`, `#A1824F`, `#A5D6D1`, `#33A7B5`. New kiosk colours derive from these.
- Pure logic modules must not import `firebaseApp`, Tauri APIs, or React — they have to run under bare `tsx`. Import types with `import type`.
- Test files are plain `node:assert/strict` scripts ending in a `console.log("<name> tests passed")` line. `npm test` runs every `*.test.ts`/`*.test.tsx` under `src/` through `tsx`. There is no test runner and no `describe`/`it`.
- Test imports of local modules use an explicit `.ts` extension (e.g. `from "./materialSearch.ts"`).
- All motion must sit inside `@media (prefers-reduced-motion: no-preference)`.
- Scope is kiosk-only: `KioskShell`, `UserView` when `kioskMode` is set, and `MakerKiosk`. Do not modify Admin View, Settings, Docs, the tab shell, or `TvDisplay`.
- After every task: `npx tsc --noEmit`, `npm run lint`, and `npm test` must all pass before committing.

---

### Task 1: Kiosk token layer

**Files:**
- Modify: `src/style.css` (append a new block at end of file)
- Modify: `src/components/KioskShell.tsx:124` (add `className` to the shell `div`)
- Test: `src/components/KioskTokens.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: the CSS class `viventory-kiosk` and the custom properties `--vk-ground`, `--vk-surface`, `--vk-surface-raised`, `--vk-ink`, `--vk-ink-muted`, `--vk-accent`, `--vk-accent-soft`, `--vk-safe`, `--vk-caution`, `--vk-empty`, `--vk-zone-1` … `--vk-zone-7`, `--vk-shadow`, `--vk-radius`. Every later task styles against these.

- [ ] **Step 1: Write the failing test**

Create `src/components/KioskTokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const styleCss = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const kioskShell = readFileSync(new URL("./KioskShell.tsx", import.meta.url), "utf8");

// The kiosk palette is additive and scoped to a class. Recolouring :root would
// break VivitaPalette.test.ts, which pins every light surface to #ffffff.
assert.match(
    styleCss,
    /\.viventory-kiosk\s*\{/,
    "kiosk tokens must be scoped to a .viventory-kiosk class",
);

const requiredTokens = [
    "--vk-ground",
    "--vk-surface",
    "--vk-surface-raised",
    "--vk-ink",
    "--vk-ink-muted",
    "--vk-accent",
    "--vk-accent-soft",
    "--vk-safe",
    "--vk-caution",
    "--vk-empty",
    "--vk-shadow",
    "--vk-radius",
];

for (const token of requiredTokens) {
    assert.match(styleCss, new RegExp(`${token}:`), `style.css should define ${token}`);
}

for (let zone = 1; zone <= 7; zone += 1) {
    assert.match(styleCss, new RegExp(`--vk-zone-${zone}:`), `style.css should define --vk-zone-${zone}`);
}

// Derived from the VIVITA brand, not invented.
assert.match(styleCss, /--vk-accent:\s*#33A7B5/i, "kiosk accent should be the VIVITA teal");
assert.match(styleCss, /--vk-accent-soft:\s*#A5D6D1/i, "kiosk soft accent should be the VIVITA mint");
assert.match(styleCss, /--vk-caution:\s*#A1824F/i, "kiosk caution should be the VIVITA bronze");
assert.match(styleCss, /--vk-ink:\s*#24262B/i, "kiosk ink should be the VIVITA near-black");

// The theme attribute lives on the root element, so the dark override has to be
// an ancestor selector rather than an attribute on the kiosk element itself.
assert.match(
    styleCss,
    /\[data-viventory-theme="dark"\]\s+\.viventory-kiosk\s*\{/,
    "dark kiosk tokens must key off the root theme attribute",
);

// The staff shell must keep its tested white.
assert.match(styleCss, /--viventory-bg:\s*#ffffff/i, "global light background must stay white");

assert.match(
    kioskShell,
    /className:\s*['"]viventory-kiosk['"]|className=['"]viventory-kiosk['"]/,
    "KioskShell root must carry the viventory-kiosk class",
);

console.log("KioskTokens tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/components/KioskTokens.test.ts`
Expected: FAIL — `AssertionError: kiosk tokens must be scoped to a .viventory-kiosk class`

- [ ] **Step 3: Add the token block to `src/style.css`**

Append at the end of the file:

```css
/* Kiosk palette.
 *
 * Additive and class-scoped on purpose. VivitaPalette.test.ts pins every
 * light-mode --viventory-* surface to #ffffff, so the child-facing shell gets
 * its own layer instead of recolouring the staff shell. Colours derive from the
 * four VIVITA site colours.
 */
.viventory-kiosk {
  --vk-ground: #FBF6EC;
  --vk-surface: #FFFFFF;
  --vk-surface-raised: #FFFDF6;
  --vk-ink: #24262B;
  --vk-ink-muted: #6F6A61;
  --vk-accent: #33A7B5;
  --vk-accent-soft: #A5D6D1;
  --vk-safe: #2E7D6B;
  --vk-caution: #A1824F;
  --vk-empty: #9A8F86;

  --vk-zone-1: #33A7B5;
  --vk-zone-2: #A1824F;
  --vk-zone-3: #7A9E4B;
  --vk-zone-4: #C2703D;
  --vk-zone-5: #6B7FC7;
  --vk-zone-6: #B0567F;
  --vk-zone-7: #4E9E86;

  --vk-radius: 18px;
  --vk-shadow: 0 1px 0 rgba(36, 38, 43, 0.05), 0 10px 24px -14px rgba(36, 38, 43, 0.5);
}

[data-viventory-theme="dark"] .viventory-kiosk {
  --vk-ground: #161D26;
  --vk-surface: #24262B;
  --vk-surface-raised: #2C2F36;
  --vk-ink: #FFFDF6;
  --vk-ink-muted: #C9CED8;
  --vk-accent: #A5D6D1;
  --vk-accent-soft: #33A7B5;
  --vk-safe: #7FCDB8;
  --vk-caution: #D8B57A;
  --vk-empty: #8A8F99;
  --vk-shadow: 0 1px 0 rgba(0, 0, 0, 0.4), 0 10px 24px -14px rgba(0, 0, 0, 0.8);
}
```

- [ ] **Step 4: Apply the class in `src/components/KioskShell.tsx`**

At line 124, change the shell root from:

```tsx
        <div style={styles.shell}>
```

to:

```tsx
        <div className="viventory-kiosk" style={styles.shell}>
```

Then change `styles.shell` (line 35-44) to paint the new ground:

```ts
    shell: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--vk-ground, var(--viventory-bg))',
        color: 'var(--vk-ink, var(--viventory-text))',
        // TV panels crop the frame edges; keep content inside the safe area.
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left)',
    } as React.CSSProperties,
```

The `var(..., fallback)` form keeps the shell rendering if the stylesheet ever fails to load.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx tsx src/components/KioskTokens.test.ts && npx tsx src/components/VivitaPalette.test.ts`
Expected: PASS — `KioskTokens tests passed` then `VivitaPalette.test.ts passed`

- [ ] **Step 6: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint output, every test line prints `passed`

- [ ] **Step 7: Commit**

```bash
git add src/style.css src/components/KioskShell.tsx src/components/KioskTokens.test.ts
git commit -m "feat(kiosk): add a scoped kiosk token layer"
```

---

### Task 2: Category identity

**Files:**
- Create: `src/utils/categoryIdentity.ts`
- Test: `src/utils/categoryIdentity.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type CategoryIconName = "wrench" | "cog" | "droplet" | "cpu" | "layers" | "box" | "shirt" | "camera" | "sparkles" | "package"`
  - `const CATEGORY_HUES: readonly number[]` (exactly 8 entries)
  - `function categoryIdentity(categoryName: string): { icon: CategoryIconName; hue: number }`

- [ ] **Step 1: Write the failing test**

Create `src/utils/categoryIdentity.test.ts`:

```ts
import assert from "node:assert/strict";
import { CATEGORY_HUES, categoryIdentity } from "./categoryIdentity.ts";

// Categories are staff-typed free text, so recognised words get a deliberate
// icon and everything else must still land somewhere sensible.
assert.equal(categoryIdentity("Hand tool").icon, "wrench");
assert.equal(categoryIdentity("Power Tool").icon, "wrench");
assert.equal(categoryIdentity("Machine").icon, "cog");
assert.equal(categoryIdentity("Machine Replacement Parts").icon, "cog");
assert.equal(categoryIdentity("Adhesive. Fasteners. Wires").icon, "droplet");
assert.equal(categoryIdentity("Electronic Hardwares & Components").icon, "cpu");
assert.equal(categoryIdentity("Device").icon, "cpu");
assert.equal(categoryIdentity("Materials").icon, "layers");
assert.equal(categoryIdentity("Packing Materials").icon, "box");
assert.equal(categoryIdentity("Storage Containers").icon, "box");
assert.equal(categoryIdentity("Photography Equipments").icon, "camera");
assert.equal(categoryIdentity("Display Props").icon, "sparkles");
assert.equal(categoryIdentity("Kit").icon, "package");

// Matching is case-insensitive.
assert.equal(categoryIdentity("HAND TOOL").icon, categoryIdentity("hand tool").icon);

// An unrecognised category still gets an identity rather than a blank card.
const unknown = categoryIdentity("VIVIPANEL supplies");
assert.equal(typeof unknown.icon, "string");
assert.ok(CATEGORY_HUES.includes(unknown.hue), "fallback hue must come from the curated set");

// Determinism: the same name must produce the same hue on every device and
// every reload, or a category changes colour when the page refreshes.
for (const name of ["VIVIPANEL supplies", "Collaterals", "Findings. Hardware", "Misc"]) {
    assert.equal(
        categoryIdentity(name).hue,
        categoryIdentity(name).hue,
        `${name} must hash to a stable hue`,
    );
}
assert.equal(categoryIdentity("Collaterals").hue, categoryIdentity("collaterals").hue);

// Every hue in play — keyword or fallback — comes from the curated set, so no
// combination can clash with the brand.
assert.equal(CATEGORY_HUES.length, 8, "the curated set is exactly 8 hues");
for (const name of [
    "Hand tool", "Machine", "Adhesive. Fasteners. Wires", "Device", "Materials",
    "Packing Materials", "Photography Equipments", "Display Props", "Kit",
    "VIVIPANEL supplies", "Collaterals", "Findings. Hardware", "Misc", "Appliances",
    "Cleaning Supply", "First Aid Equipment", "Protectives", "VIVIWARE CELL",
]) {
    assert.ok(
        CATEGORY_HUES.includes(categoryIdentity(name).hue),
        `${name} should resolve to a curated hue`,
    );
}

// Empty and whitespace names are real in this data and must not throw.
assert.ok(CATEGORY_HUES.includes(categoryIdentity("").hue));
assert.ok(CATEGORY_HUES.includes(categoryIdentity("   ").hue));

console.log("categoryIdentity tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/utils/categoryIdentity.test.ts`
Expected: FAIL — cannot find module `./categoryIdentity.ts`

- [ ] **Step 3: Write the implementation**

Create `src/utils/categoryIdentity.ts`:

```ts
/**
 * Gives every material category a glyph and a colour, so a wall of cards is
 * scannable before a single word is read.
 *
 * Categories come from `collectMaterialCategories`, which builds the list out
 * of whatever staff typed into the inventory — 27 distinct values today,
 * including "Findings. Hardware" and "VIVIPANEL supplies". A hardcoded map
 * would go stale the first time someone adds one, so recognised keywords get a
 * deliberate identity and everything else falls back to a stable hash.
 */

export type CategoryIconName =
    | "wrench"
    | "cog"
    | "droplet"
    | "cpu"
    | "layers"
    | "box"
    | "shirt"
    | "camera"
    | "sparkles"
    | "package";

/**
 * The only hues any category may use. A free hue from a hash produces colours
 * that fight the VIVITA palette; choosing from a curated set cannot.
 */
export const CATEGORY_HUES = [28, 45, 95, 150, 190, 215, 265, 330] as const;

/** Keyword → [icon, index into CATEGORY_HUES]. First match in order wins. */
const KEYWORD_IDENTITY: ReadonlyArray<readonly [string, CategoryIconName, number]> = [
    ["tool", "wrench", 0],
    ["machine", "cog", 5],
    ["adhesive", "droplet", 7],
    ["electronic", "cpu", 6],
    ["peripheral", "cpu", 6],
    ["device", "cpu", 6],
    ["memory", "cpu", 6],
    ["textile", "shirt", 7],
    ["fabric", "shirt", 7],
    ["photography", "camera", 4],
    ["display", "sparkles", 3],
    ["collateral", "sparkles", 3],
    ["packing", "box", 1],
    ["storage", "box", 1],
    ["container", "box", 1],
    ["kit", "package", 1],
    ["appliance", "cog", 5],
    ["kitchen", "cog", 5],
    ["paper", "layers", 2],
    ["material", "layers", 2],
];

const DEFAULT_ICON: CategoryIconName = "package";

/**
 * FNV-style rolling hash. Any stable hash works; what matters is that it is
 * deterministic across devices and reloads so a category never changes colour
 * under a child mid-session.
 */
function hueFor(normalized: string): number {
    let hash = 2166136261;

    for (let index = 0; index < normalized.length; index += 1) {
        hash ^= normalized.charCodeAt(index);
        hash = Math.imul(hash, 16777619) >>> 0;
    }

    return CATEGORY_HUES[hash % CATEGORY_HUES.length];
}

export function categoryIdentity(categoryName: string): { icon: CategoryIconName; hue: number } {
    const normalized = categoryName.trim().toLowerCase();

    if (!normalized) {
        return { icon: DEFAULT_ICON, hue: CATEGORY_HUES[0] };
    }

    for (const [keyword, icon, hueIndex] of KEYWORD_IDENTITY) {
        if (normalized.includes(keyword)) {
            return { icon, hue: CATEGORY_HUES[hueIndex] };
        }
    }

    return { icon: DEFAULT_ICON, hue: hueFor(normalized) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx src/utils/categoryIdentity.test.ts`
Expected: PASS — `categoryIdentity tests passed`

- [ ] **Step 5: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint output, all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/categoryIdentity.ts src/utils/categoryIdentity.test.ts
git commit -m "feat(kiosk): resolve an icon and colour for every category"
```

---

### Task 3: Kid-safe description

**Files:**
- Modify: `src/utils/materialDetails.ts` (append a new exported function)
- Test: `src/utils/materialDetails.test.ts` (extend)

**Interfaces:**
- Consumes: nothing
- Produces: `function kioskDescription(description: string): string`

- [ ] **Step 1: Write the failing test**

Append to `src/utils/materialDetails.test.ts`, and add `kioskDescription` to the existing import block at the top of that file:

```ts
// Kid-facing cards currently render the raw description, which is a merged blob
// of staff fields. Children have been shown purchase remarks, loan history and
// raw Notion URLs. This is an allowlist, not a denylist: free-text staff data
// guarantees a denylist leaks the next key nobody anticipated.

// The one keyed field a child benefits from.
assert.equal(
    kioskDescription("Used for: paper, plastic, wood"),
    "paper, plastic, wood",
);

// Staff fields are dropped.
assert.equal(kioskDescription("Purchase remarks: Comes with 4 mini tubes, Red label"), "");
assert.equal(kioskDescription("Loan period: March 30, 2022 → May 22, 2022"), "");
assert.equal(kioskDescription("Loaned to: External Site_ Hebron"), "");
assert.equal(kioskDescription("Kit: Leather Kit"), "");

// Unrecognised keys are dropped too — that is the point of an allowlist.
assert.equal(kioskDescription("Procurement notes: reorder in April"), "");

// Anything carrying a URL is dropped whatever its key.
assert.equal(
    kioskDescription("Specific materials: Calico Fabric (https://app.notion.com/p/Calico-abc?pvs=21)"),
    "",
);
assert.equal(kioskDescription("Used for: see https://example.com/guide"), "");

// A mixed blob keeps only the child-facing part.
assert.equal(
    kioskDescription(
        "Used for: paper, plastic; Specific materials: Pom Poms (https://app.notion.com/p/x); Purchase remarks: 30 sticks",
    ),
    "paper, plastic",
);

// A plain keyless description is a genuine human sentence, not a staff field,
// so it survives — unless it carries a URL.
assert.equal(kioskDescription("Cat 6 networking cable"), "Cat 6 networking cable");
assert.equal(kioskDescription("See https://example.com"), "");

// Empty input stays empty rather than throwing.
assert.equal(kioskDescription(""), "");
assert.equal(kioskDescription("   "), "");
assert.equal(kioskDescription(";;"), "");

console.log("kioskDescription tests passed");
```

Note: the existing file already ends with its own `console.log(...)` line — leave it, and put this block above it so the file still reports its original name too.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/utils/materialDetails.test.ts`
Expected: FAIL — `kioskDescription is not a function` (or an import error)

- [ ] **Step 3: Write the implementation**

Append to `src/utils/materialDetails.ts`:

```ts
/** Keyed segments a child benefits from. Everything else is staff bookkeeping. */
const KIOSK_DESCRIPTION_KEYS = new Set(["used for"]);

const CONTAINS_URL = /https?:\/\//i;

/**
 * Strips a material description down to what a child should read.
 *
 * `description` is a merged blob of `Key: value` segments joined with ";" —
 * purchase remarks, loan history, supplier notes and Notion URLs all end up in
 * it, and the kiosk card renders it verbatim today. This keeps only an allowed
 * key plus genuine keyless prose, and drops anything carrying a URL.
 *
 * An allowlist rather than a denylist: staff type these keys by hand, so a
 * denylist is certain to leak the first key nobody thought of.
 */
export function kioskDescription(description: string): string {
    const kept: string[] = [];

    for (const segment of description.split(";")) {
        const trimmed = segment.trim();
        if (!trimmed || CONTAINS_URL.test(trimmed)) continue;

        const separatorIndex = trimmed.indexOf(":");

        if (separatorIndex === -1) {
            kept.push(trimmed);
            continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim().toLowerCase();
        if (!KIOSK_DESCRIPTION_KEYS.has(key)) continue;

        const value = trimmed.slice(separatorIndex + 1).trim();
        if (value) kept.push(value);
    }

    return kept.join("; ");
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx src/utils/materialDetails.test.ts`
Expected: PASS — both `materialDetails tests passed` and `kioskDescription tests passed`

- [ ] **Step 5: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint output, all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/materialDetails.ts src/utils/materialDetails.test.ts
git commit -m "feat(kiosk): keep staff bookkeeping off kid-facing cards"
```

---

### Task 4: Substitute finding

**Files:**
- Modify: `src/utils/materialSearch.ts` (append a new exported function)
- Test: `src/utils/materialSearch.test.ts` (extend)

**Interfaces:**
- Consumes: `materialCategoryNames` from `./materialCategories`, `isMaterialAvailable` from `./materialDetails`
- Produces: `function findSubstitutes(material: Material, all: Material[], limit?: number): Material[]`

- [ ] **Step 1: Write the failing test**

Append to `src/utils/materialSearch.test.ts`, adding `findSubstitutes` to the existing import block:

```ts
// "Out of stock" is a dead end for a child. Offering in-stock alternatives from
// the same category is what turns a refusal into a next step.
function makeSubstituteMaterial(overrides: Partial<Material>): Material {
    return {
        id: "sub-0",
        name: "Thing",
        description: "",
        quantity: 5,
        unit: "pcs",
        category: "Adhesive. Fasteners. Wires",
        compartmentId: "comp-1",
        createdAt: "2026-07-05T00:00:00.000Z",
        ...overrides,
    };
}

const emptyGlue = makeSubstituteMaterial({ id: "s1", name: "Superglue", quantity: 0 });
const stockedGlue = makeSubstituteMaterial({ id: "s2", name: "Wood Glue", quantity: 4 });
const otherStockedGlue = makeSubstituteMaterial({ id: "s3", name: "Acrylic Glue", quantity: 2 });
const emptyPeer = makeSubstituteMaterial({ id: "s4", name: "Craft Glue Stick", quantity: 0 });
const unrelated = makeSubstituteMaterial({ id: "s5", name: "Hammer", category: "Hand tool", quantity: 9 });
const pool = [emptyGlue, stockedGlue, otherStockedGlue, emptyPeer, unrelated];

const substitutes = findSubstitutes(emptyGlue, pool);

// Only in-stock, only same-category, never the material itself.
assert.deepEqual(
    substitutes.map(m => m.id),
    ["s3", "s2"],
    "in-stock same-category peers, sorted by name for a stable order",
);
assert.ok(!substitutes.some(m => m.id === emptyGlue.id), "must not suggest the item itself");
assert.ok(!substitutes.some(m => m.id === emptyPeer.id), "must not suggest another empty item");
assert.ok(!substitutes.some(m => m.id === unrelated.id), "must not cross categories");

// The cap is respected.
assert.equal(findSubstitutes(emptyGlue, pool, 1).length, 1);
assert.equal(findSubstitutes(emptyGlue, pool, 0).length, 0);

// A material sharing more categories ranks above one sharing fewer.
const multiCategory = makeSubstituteMaterial({
    id: "s6",
    name: "Zzz Multi Glue",
    category: "Adhesive. Fasteners. Wires, Materials",
    quantity: 3,
});
const target = makeSubstituteMaterial({
    id: "s7",
    name: "Target",
    category: "Adhesive. Fasteners. Wires, Materials",
    quantity: 0,
});
const ranked = findSubstitutes(target, [target, multiCategory, stockedGlue]);
assert.equal(ranked[0].id, "s6", "more shared categories outranks alphabetical order");

// A material with no category has nothing to substitute from.
const uncategorised = makeSubstituteMaterial({ id: "s8", category: "", quantity: 0 });
assert.deepEqual(findSubstitutes(uncategorised, pool), []);

console.log("findSubstitutes tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/utils/materialSearch.test.ts`
Expected: FAIL — `findSubstitutes is not a function` (or an import error)

- [ ] **Step 3: Write the implementation**

Append to `src/utils/materialSearch.ts`, adding these imports at the top of the file:

```ts
import { materialCategoryNames } from "./materialCategories";
import { isMaterialAvailable } from "./materialDetails";
```

then:

```ts
/**
 * In-stock alternatives for a material a child cannot have right now.
 *
 * A grey "Out of stock" pill ends the conversation; three things they *can*
 * use keeps it going. Ranked by how many categories they share, then by name so
 * the order is stable across renders.
 */
export function findSubstitutes(
    material: Material,
    all: Material[],
    limit = 3
): Material[] {
    const wanted = new Set(
        materialCategoryNames(material).map(name => name.toLowerCase())
    );

    if (wanted.size === 0 || limit <= 0) {
        return [];
    }

    return all
        .filter(candidate => candidate.id !== material.id && isMaterialAvailable(candidate))
        .map(candidate => ({
            candidate,
            shared: materialCategoryNames(candidate)
                .filter(name => wanted.has(name.toLowerCase())).length,
        }))
        .filter(entry => entry.shared > 0)
        .sort((a, b) =>
            b.shared - a.shared || a.candidate.name.localeCompare(b.candidate.name)
        )
        .slice(0, limit)
        .map(entry => entry.candidate);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx src/utils/materialSearch.test.ts`
Expected: PASS — both `materialSearch tests passed` and `findSubstitutes tests passed`

- [ ] **Step 5: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint output, all tests pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/materialSearch.ts src/utils/materialSearch.test.ts
git commit -m "feat(kiosk): offer in-stock alternatives instead of a dead end"
```

---

### Task 5: Kiosk card rendering

**Files:**
- Create: `src/utils/zoneIdentity.ts`
- Create: `src/components/CategoryGlyph.tsx`
- Modify: `src/components/UserView.tsx` (props type, `styles`, card body at lines 610-653)
- Modify: `src/components/KioskShell.tsx:140-152` (pass `kioskMode`)
- Test: `src/utils/zoneIdentity.test.ts`, `src/components/KioskCard.test.ts`

**Interfaces:**
- Consumes: `categoryIdentity`, `CategoryIconName` (Task 2); `kioskDescription` (Task 3); `findSubstitutes` (Task 4); the `--vk-*` tokens (Task 1)
- Produces:
  - `function zoneToken(compartmentId: string | undefined, floors: FloorData[]): string | null`
  - `UserView` accepts `kioskMode?: boolean`
  - `CategoryGlyph` component with props `{ category: string; size?: number }`

The zone helper is scaffolding for the card and ships with it: an area is a
`FloorElement` (materials link to one by `compartmentId`, which is how
`getAreaInventory` resolves them), so the dot's colour has to be derived from
the floor plan rather than from the material's free-text `location` field.

- [ ] **Step 1: Write the failing zone test**

Create `src/utils/zoneIdentity.test.ts`:

```ts
import assert from "node:assert/strict";
import type { FloorData } from "../types.ts";
import { zoneToken } from "./zoneIdentity.ts";

const floors: FloorData[] = [
    {
        id: "floor-1",
        name: "Ground",
        elements: [
            { id: "white-space", type: "compartment", x: 0, y: 0, width: 10, height: 10 },
            // Furniture sits in the same list and must not shift zone colours.
            { id: "a-chair", type: "chair", x: 0, y: 0, width: 1, height: 1 },
            { id: "tinkering-studio", type: "compartment", x: 0, y: 0, width: 10, height: 10 },
        ],
    },
    {
        id: "floor-2",
        name: "Upper",
        elements: [
            { id: "roof-terrace", type: "compartment", x: 0, y: 0, width: 10, height: 10 },
        ],
    },
];

// Areas get a stable colour by their position in the floor plan, so the same
// area is the same colour on the card and on the map.
assert.equal(zoneToken("white-space", floors), "var(--vk-zone-1)");
assert.equal(zoneToken("tinkering-studio", floors), "var(--vk-zone-2)");
assert.equal(zoneToken("roof-terrace", floors), "var(--vk-zone-3)");

// Stable across calls — a dot must not change colour on re-render.
assert.equal(zoneToken("tinkering-studio", floors), zoneToken("tinkering-studio", floors));

// Unknown, missing, and empty inputs have no zone rather than a wrong one.
assert.equal(zoneToken("does-not-exist", floors), null);
assert.equal(zoneToken(undefined, floors), null);
assert.equal(zoneToken("white-space", []), null);

// Only compartments are areas. A chair is not a zone.
assert.equal(zoneToken("a-chair", floors), null);

// More than seven areas wrap rather than running off the end of the token set.
const many: FloorData[] = [{
    id: "f",
    name: "F",
    elements: Array.from({ length: 9 }, (_, index) => ({
        id: `area-${index}`, type: "compartment" as const, x: 0, y: 0, width: 1, height: 1,
    })),
}];
assert.equal(zoneToken("area-0", many), "var(--vk-zone-1)");
assert.equal(zoneToken("area-7", many), "var(--vk-zone-1)");
assert.equal(zoneToken("area-8", many), "var(--vk-zone-2)");

console.log("zoneIdentity tests passed");
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx tsx src/utils/zoneIdentity.test.ts`
Expected: FAIL — cannot find module `./zoneIdentity.ts`

- [ ] **Step 3: Write `src/utils/zoneIdentity.ts`**

```ts
import type { FloorData } from "../types";

/** How many `--vk-zone-*` tokens exist. Areas beyond this wrap. */
const ZONE_TOKEN_COUNT = 7;

/**
 * The colour token for the area a material lives in.
 *
 * Materials link to an area by `compartmentId`, which matches a `FloorElement`
 * id — the same relationship `getAreaInventory` uses. Position in the floor plan
 * decides the colour, so an area is the same colour on a card as on the map, and
 * stays that colour across renders.
 *
 * Only `compartment` elements count. Floors also hold chairs, tables and stairs;
 * counting those would let moving a chair repaint every zone.
 */
export function zoneToken(
    compartmentId: string | undefined,
    floors: FloorData[]
): string | null {
    if (!compartmentId) return null;

    let position = 0;

    for (const floor of floors) {
        for (const element of floor.elements) {
            if (element.type !== "compartment") continue;

            if (element.id === compartmentId) {
                return `var(--vk-zone-${(position % ZONE_TOKEN_COUNT) + 1})`;
            }

            position += 1;
        }
    }

    return null;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx tsx src/utils/zoneIdentity.test.ts`
Expected: PASS — `zoneIdentity tests passed`

- [ ] **Step 5: Write the failing card test**

Create `src/components/KioskCard.test.ts`. This is a source check in the style of the repo's existing `*visual source checks*` tests, because the card is JSX that bare `tsx` cannot render:

```ts
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const userView = readFileSync(new URL("./UserView.tsx", import.meta.url), "utf8");
const kioskShell = readFileSync(new URL("./KioskShell.tsx", import.meta.url), "utf8");
const glyph = readFileSync(new URL("./CategoryGlyph.tsx", import.meta.url), "utf8");

// The kid card must not render the raw description. That field carries purchase
// remarks, loan history and Notion URLs.
assert.match(userView, /kioskDescription/, "UserView must route descriptions through kioskDescription");
assert.match(
    userView,
    /kioskMode\s*\?\s*kioskDescription\(m\.description\)\s*:\s*m\.description/,
    "the raw description must survive only outside kiosk mode",
);

// Substitutes replace the dead end.
assert.match(userView, /findSubstitutes/, "UserView must offer substitutes for unavailable materials");

// Category identity drives the glyph.
assert.match(userView, /CategoryGlyph/, "kiosk cards must show a category glyph");
assert.match(glyph, /categoryIdentity/, "CategoryGlyph must resolve identity from the category name");

// Every icon name in the union must have a component mapped, or a category
// silently renders nothing.
for (const icon of [
    "wrench", "cog", "droplet", "cpu", "layers", "box", "shirt", "camera", "sparkles", "package",
]) {
    assert.match(glyph, new RegExp(`\\b${icon}\\b`), `CategoryGlyph must map the "${icon}" icon`);
}

// Kiosk styling uses the scoped tokens, not the staff palette.
assert.match(userView, /--vk-/, "kiosk card styles must use the --vk-* tokens");

// An area's colour comes from the floor plan, so the dot matches the map.
assert.match(userView, /zoneToken/, "kiosk cards must colour their zone dot from the floor plan");

// The supervision flag must be visible on the card, not only inside a bot answer.
assert.match(
    userView,
    /safetyLevel\s*===\s*['"]adult['"]/,
    "kiosk cards must badge materials that need an adult",
);
assert.match(userView, /--vk-caution/, "the safety badge must use the caution token");

// The shell turns the mode on.
assert.match(kioskShell, /kioskMode/, "KioskShell must put UserView into kiosk mode");

console.log("KioskCard tests passed");
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx tsx src/components/KioskCard.test.ts`
Expected: FAIL — cannot read `CategoryGlyph.tsx` (file does not exist)

- [ ] **Step 7: Create `src/components/CategoryGlyph.tsx`**

```tsx
import {
    Box,
    Camera,
    Cog,
    Cpu,
    Droplet,
    Layers,
    Package,
    Shirt,
    Sparkles,
    Wrench,
} from 'lucide-react';
import { categoryIdentity, type CategoryIconName } from '../utils/categoryIdentity';

const ICONS: Record<CategoryIconName, typeof Wrench> = {
    wrench: Wrench,
    cog: Cog,
    droplet: Droplet,
    cpu: Cpu,
    layers: Layers,
    box: Box,
    shirt: Shirt,
    camera: Camera,
    sparkles: Sparkles,
    package: Package,
};

/**
 * The category badge on a kiosk card. Colour and glyph both come from
 * `categoryIdentity`, so a card is recognisable across a room before any of its
 * text is legible.
 */
export function CategoryGlyph({ category, size = 18 }: { category: string; size?: number }) {
    const { icon, hue } = categoryIdentity(category);
    const Icon = ICONS[icon];

    return (
        <span
            aria-hidden="true"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size + 14,
                height: size + 14,
                borderRadius: 12,
                flexShrink: 0,
                background: `hsl(${hue} 62% 92%)`,
                color: `hsl(${hue} 58% 28%)`,
            }}
        >
            <Icon size={size} strokeWidth={2.25} />
        </span>
    );
}

export default CategoryGlyph;
```

- [ ] **Step 8: Add the `kioskMode` prop to `UserView`**

In `src/components/UserView.tsx`, add these imports:

```tsx
import { kioskDescription } from '../utils/materialDetails';
import { findSubstitutes } from '../utils/materialSearch';
import { zoneToken } from '../utils/zoneIdentity';
import { CategoryGlyph } from './CategoryGlyph';
```

Add `kioskMode?: boolean;` to the `UserView` props type, and destructure it with a default of `false` alongside the existing props. `floors` is already a prop, so `zoneToken` has what it needs.

- [ ] **Step 9: Replace the card body**

Replace `src/components/UserView.tsx` lines 610-653 (the `displayedMaterials.map` callback) with:

```tsx
                            {displayedMaterials.map(m => {
                                const available = isMaterialAvailable(m);
                                const shownDescription = kioskMode
                                    ? kioskDescription(m.description)
                                    : m.description;
                                // Staff still need location and storage; a child
                                // only needs to know which category it is.
                                const chips = (kioskMode
                                    ? [m.category]
                                    : [
                                        m.category,
                                        m.location && `📍 ${m.location}`,
                                        m.storage && `📦 ${m.storage}`,
                                    ]
                                ).filter(Boolean) as string[];
                                const substitutes = kioskMode && !available
                                    ? findSubstitutes(m, materials)
                                    : [];
                                const zone = kioskMode ? zoneToken(m.compartmentId, floors) : null;
                                const needsAdult = kioskMode && m.safetyLevel === 'adult';

                                return (
                                    <div key={m.id} style={styles.card(!available)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
                                                {kioskMode && <CategoryGlyph category={m.category ?? ''} />}
                                                <strong style={{ fontSize: 16, textAlign: 'left', lineHeight: 1.25 }}>
                                                    {zone && <span style={styles.zoneDot(zone)} aria-hidden="true" />}
                                                    {m.name}
                                                </strong>
                                            </div>
                                            <span style={styles.statusPill(!available)}>
                                                {translatedStockLabel(language, m)}
                                            </span>
                                        </div>

                                        {needsAdult && (
                                            <span style={styles.safetyBadge}>
                                                {t('user.needsAdult')}
                                            </span>
                                        )}

                                        {chips.length > 0 && (
                                            <div style={styles.chipRow}>
                                                {chips.map(chip => (
                                                    <span key={chip} style={styles.chip} title={chip}>
                                                        {chip}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {shownDescription && (
                                            <p style={styles.cardDescription} title={shownDescription}>
                                                {shownDescription}
                                            </p>
                                        )}

                                        {substitutes.length > 0 && (
                                            <div style={styles.substitutePanel}>
                                                <span style={styles.substituteLead}>
                                                    {t('user.tryInstead')}
                                                </span>
                                                <div style={styles.chipRow}>
                                                    {substitutes.map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            style={styles.substituteChip}
                                                            onClick={() => setSearch(s.name)}
                                                        >
                                                            {s.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            style={{ ...styles.btnPrimary, marginTop: 'auto' }}
                                            onClick={() => startRequest(m)}
                                            disabled={!available}
                                        >
                                            <Send size={14} /> {t('user.request')}
                                        </button>
                                    </div>
                                );
                            })}
```

- [ ] **Step 10: Add the five new styles**

In the `styles` object in `src/components/UserView.tsx`, next to `chipRow`, add:

```ts
    zoneDot: (token: string): React.CSSProperties => ({
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        marginRight: 7,
        verticalAlign: 'middle',
        background: token,
        flexShrink: 0,
    }),

    safetyBadge: {
        alignSelf: 'flex-start',
        padding: '4px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 750,
        color: 'var(--vk-caution, var(--viventory-text))',
        background: 'color-mix(in srgb, var(--vk-caution, #A1824F) 16%, transparent)',
        border: '1px solid var(--vk-caution, var(--viventory-border))',
    } as React.CSSProperties,
```

and:

```ts
    substitutePanel: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 10px',
        borderRadius: 12,
        background: 'var(--vk-surface-raised, transparent)',
        border: '1px solid var(--vk-accent-soft, var(--viventory-border))',
    } as React.CSSProperties,

    substituteLead: {
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--vk-ink-muted, var(--viventory-muted-text))',
    } as React.CSSProperties,

    substituteChip: {
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid var(--vk-accent, var(--viventory-border))',
        background: 'var(--vk-surface, transparent)',
        color: 'var(--vk-ink, var(--viventory-text))',
        fontSize: 13,
        fontWeight: 650,
        cursor: 'pointer',
    } as React.CSSProperties,
```

- [ ] **Step 11: Add the translation keys**

In `src/i18n/i18n.ts`, add `"user.tryInstead"` and `"user.needsAdult"` to all five dictionaries (`en`, `zh`, `ja`, `ms`, `ta`):

`user.tryInstead`

- `en`: `"none left right now — try these instead"`
- `zh`: `"暂时没有了 — 试试这些"`
- `ja`: `"いまは在庫がありません — こちらはどうですか"`
- `ms`: `"kehabisan buat masa ini — cuba yang ini"`
- `ta`: `"இப்போது இல்லை — இவற்றை முயற்சிக்கவும்"`

`user.needsAdult`

- `en`: `"Ask an adult first"`
- `zh`: `"请先询问成人"`
- `ja`: `"まず大人に聞いてね"`
- `ms`: `"Tanya orang dewasa dahulu"`
- `ta`: `"முதலில் ஒரு பெரியவரிடம் கேளுங்கள்"`

`i18n.test.ts` already asserts every language covers exactly the English key set, so a missing translation fails the suite.

- [ ] **Step 12: Turn the mode on in `KioskShell`**

In `src/components/KioskShell.tsx`, add `kioskMode` to the `UserView` element at line 140:

```tsx
                    <UserView
                        floors={inventory.floors}
                        materials={inventory.materials}
                        requests={inventory.requests}
                        onSubmitRequest={inventory.submitRequest}
                        initialTab={destination === 'map' ? 'map' : 'materials'}
                        showTabBar={false}
                        kioskMode
                        prefs={{
                            hideOutOfStock: false,
                            compactCards: false,
                            defaultFloor: 0,
                        }}
                    />
```

- [ ] **Step 13: Run the tests to verify they pass**

Run: `npx tsx src/components/KioskCard.test.ts && npx tsx src/utils/zoneIdentity.test.ts && npx tsx src/i18n/i18n.test.ts`
Expected: PASS — `KioskCard tests passed`, `zoneIdentity tests passed`, `i18n tests passed`

- [ ] **Step 14: Verify in the real app**

```bash
npx vite --port 5199 &
```

Open `http://127.0.0.1:5199/?display=kiosk`, search for `glue`, and confirm: category glyphs appear, zone dots are coloured, no card shows "Purchase remarks" or a `notion.com` URL, an out-of-stock card offers tappable alternatives, and a supervised tool (search `laser`) carries the "Ask an adult first" badge. Then open `http://127.0.0.1:5199/` (staff shell) and confirm the User View tab still shows location and storage chips and the full description.

- [ ] **Step 15: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint output, all tests pass

- [ ] **Step 16: Commit**

```bash
git add src/utils/zoneIdentity.ts src/utils/zoneIdentity.test.ts src/components/CategoryGlyph.tsx src/components/UserView.tsx src/components/KioskShell.tsx src/components/KioskCard.test.ts src/i18n/i18n.ts
git commit -m "feat(kiosk): redesign the material card for children"
```

---

### Task 6: Motion and feedback

**Files:**
- Modify: `src/style.css` (append motion rules)
- Modify: `src/components/UserView.tsx:444-450` (confirmation hold)
- Test: `src/components/KioskMotion.test.ts`

**Interfaces:**
- Consumes: the `.viventory-kiosk` class (Task 1)
- Produces: `const REQUEST_CONFIRMATION_MS = 1200` in `src/components/UserView.tsx`

Note: the test reads `UserView.tsx` as text rather than importing it. Importing
the component under bare `tsx` would pull in React, `lucide-react`, and the
inventory tree — the project keeps testable logic clear of those imports, and a
source check is what the existing `*visual source checks*` tests already do.

- [ ] **Step 1: Write the failing test**

Create `src/components/KioskMotion.test.ts`:

```ts
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const styleCss = readFileSync(new URL("../style.css", import.meta.url), "utf8");
const userView = readFileSync(new URL("./UserView.tsx", import.meta.url), "utf8");

// Every animation is opt-out. A child who needs stillness gets the instant
// behaviour, not a degraded one.
const motionBlock = styleCss.match(
    /@media \(prefers-reduced-motion: no-preference\)[\s\S]*$/,
);
assert.ok(motionBlock, "kiosk motion must live behind a prefers-reduced-motion guard");

const guarded = motionBlock[0];
assert.match(guarded, /\.viventory-kiosk/, "motion rules must be scoped to the kiosk");
assert.match(guarded, /transition/, "motion is CSS transitions, no animation library");
assert.match(guarded, /:active/, "touch targets need a press state");

// 800ms is shorter than the glance it takes a child to look back at the screen.
const declared = userView.match(/const REQUEST_CONFIRMATION_MS\s*=\s*(\d+)/);
assert.ok(declared, "UserView must name the confirmation hold rather than inline 800");
assert.ok(
    Number(declared[1]) >= 1200,
    "the request confirmation must be held long enough to be seen",
);
assert.match(
    userView,
    /\},\s*REQUEST_CONFIRMATION_MS\)/,
    "the close timer must use the named constant",
);
assert.ok(!/\},\s*800\)/.test(userView), "the old 800ms timer must be gone");

console.log("KioskMotion tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/components/KioskMotion.test.ts`
Expected: FAIL — `UserView must name the confirmation hold rather than inline 800`

- [ ] **Step 3: Name and use the confirmation constant**

In `src/components/UserView.tsx`, add near the top of the file:

```ts
/**
 * How long the "request sent" confirmation is held.
 *
 * Was 800ms, which is shorter than the time a child takes to look back up at
 * the screen after tapping — the acknowledgement existed but was routinely
 * missed.
 */
const REQUEST_CONFIRMATION_MS = 1200;
```

Then change line 450 from `}, 800);` to `}, REQUEST_CONFIRMATION_MS);`.

- [ ] **Step 4: Append the motion rules to `src/style.css`**

```css
@media (prefers-reduced-motion: no-preference) {
  .viventory-kiosk button,
  .viventory-kiosk [role="button"] {
    transition: transform 120ms ease, background-color 160ms ease, box-shadow 160ms ease;
  }

  .viventory-kiosk button:active,
  .viventory-kiosk [role="button"]:active {
    transform: scale(0.96);
  }

  .viventory-kiosk button:disabled:active {
    transform: none;
  }

  .viventory-kiosk .vk-card {
    animation: vk-settle 220ms ease both;
  }

  .viventory-kiosk .vk-confirm {
    animation: vk-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes vk-settle {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  }

  @keyframes vk-pop {
    0% { opacity: 0; transform: scale(0.8); }
    60% { transform: scale(1.06); }
    100% { opacity: 1; transform: scale(1); }
  }
}
```

- [ ] **Step 5: Attach the two class names**

In `src/components/UserView.tsx`:

- On the card `div` (the one using `styles.card(!available)`), add `className={kioskMode ? 'vk-card' : undefined}`.
- On the submitted-confirmation `div` at line 679, add `className="vk-confirm"`.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx tsx src/components/KioskMotion.test.ts`
Expected: PASS — `KioskMotion tests passed`

- [ ] **Step 7: Verify in the real app**

With the dev server running, open `http://127.0.0.1:5199/?display=kiosk`, tap a Request button and submit. Confirm the press scales, cards settle in, and the confirmation is comfortably readable before the dialog closes.

- [ ] **Step 8: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint output, all tests pass

- [ ] **Step 9: Commit**

```bash
git add src/style.css src/components/UserView.tsx src/components/KioskMotion.test.ts
git commit -m "feat(kiosk): make the kiosk respond to being touched"
```

---

### Task 7: Maker Bot expression

**Files:**
- Create: `src/components/makerAvatarState.ts`
- Create: `src/components/MakerAvatar.tsx`
- Modify: `src/components/MakerKiosk.tsx` (render the avatar beside the current answer)
- Test: `src/components/makerAvatarState.test.ts`

**Interfaces:**
- Consumes: `MakerAnswer` from `./makerspaceData`
- Produces:
  - `type MakerAvatarState = "waving" | "serious" | "thinking" | "cheerful"`
  - `function makerAvatarState(answer: MakerAnswer | null): MakerAvatarState`
  - `MakerAvatar` component with props `{ state: MakerAvatarState; size?: number }`

- [ ] **Step 1: Write the failing test**

Create `src/components/makerAvatarState.test.ts`:

```ts
import assert from "node:assert/strict";
import { makerAvatarState } from "./makerAvatarState.ts";
import { answerMakerQuery, makerspaceItems, projectIdeas } from "./makerspaceData.ts";

// The bot already knows what kind of answer it is giving. The face is a pure
// read of that, not new state.
assert.equal(makerAvatarState(null), "waving", "an idle bot is welcoming");

assert.equal(
    makerAvatarState(answerMakerQuery("hi", makerspaceItems, projectIdeas)),
    "waving",
);

assert.equal(
    makerAvatarState(answerMakerQuery("qqqqqq", makerspaceItems, projectIdeas)),
    "thinking",
    "an unknown answer should not look happy about it",
);

assert.equal(
    makerAvatarState(answerMakerQuery("where is the hot glue gun", makerspaceItems, projectIdeas)),
    "cheerful",
);

// Safety wins over everything. A supervision warning currently looks exactly
// like any other block of text.
const soldering = answerMakerQuery("how do I use a soldering iron", makerspaceItems, projectIdeas);
assert.equal(makerAvatarState(soldering), "serious", "an adult-supervision answer must look serious");

// Safety beats intent even when the intent would otherwise be cheerful.
assert.equal(
    makerAvatarState({
        intent: "locate",
        title: "Found: Test",
        item: { ...makerspaceItems[0], safetyLevel: "adult" },
        sections: [],
        projects: [],
        suggestedPrompts: [],
    }),
    "serious",
);

console.log("makerAvatarState tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/components/makerAvatarState.test.ts`
Expected: FAIL — cannot find module `./makerAvatarState.ts`

- [ ] **Step 3: Write the state module**

Create `src/components/makerAvatarState.ts`:

```ts
import type { MakerAnswer } from "./makerspaceData";

export type MakerAvatarState = "waving" | "serious" | "thinking" | "cheerful";

/**
 * Picks the bot's expression from the answer it is already returning.
 *
 * Safety outranks intent deliberately: the adult-supervision warning is the one
 * message that must not look like ordinary chatter, and today it renders as
 * another identical block of text.
 */
export function makerAvatarState(answer: MakerAnswer | null): MakerAvatarState {
    if (!answer) return "waving";

    const hasSafetySection = answer.sections.some(section => section.kind === "safety");
    if (answer.item?.safetyLevel === "adult" || hasSafetySection) {
        return "serious";
    }

    if (answer.intent === "greeting") return "waving";
    if (answer.intent === "unknown") return "thinking";

    return "cheerful";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx src/components/makerAvatarState.test.ts`
Expected: PASS — `makerAvatarState tests passed`

- [ ] **Step 5: Write the avatar component**

Create `src/components/MakerAvatar.tsx`:

```tsx
import type { MakerAvatarState } from './makerAvatarState';

const EYES: Record<MakerAvatarState, { rx: number; ry: number; cy: number }> = {
    waving: { rx: 3.2, ry: 3.2, cy: 27 },
    cheerful: { rx: 3.2, ry: 2.2, cy: 26 },
    thinking: { rx: 2.6, ry: 3.4, cy: 27 },
    serious: { rx: 3.4, ry: 1.6, cy: 27 },
};

const MOUTHS: Record<MakerAvatarState, string> = {
    waving: 'M24 36 q8 6 16 0',
    cheerful: 'M24 35 q8 8 16 0',
    thinking: 'M26 37 q6 -3 12 0',
    serious: 'M25 37 h14',
};

const ACCENTS: Record<MakerAvatarState, string> = {
    waving: 'var(--vk-accent, #33A7B5)',
    cheerful: 'var(--vk-safe, #2E7D6B)',
    thinking: 'var(--vk-ink-muted, #6F6A61)',
    serious: 'var(--vk-caution, #A1824F)',
};

/**
 * The Maker Bot's face. One SVG whose eyes and mouth swap with the state, so
 * the tone of an answer is visible before it is read — a supervision warning
 * should not look like a cheerful find.
 */
export function MakerAvatar({ state, size = 64 }: { state: MakerAvatarState; size?: number }) {
    const eyes = EYES[state];
    const accent = ACCENTS[state];

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            role="img"
            aria-label={`Maker Bot is ${state}`}
        >
            <rect x="8" y="12" width="48" height="40" rx="14" fill={accent} opacity="0.16" />
            <rect x="8" y="12" width="48" height="40" rx="14" fill="none" stroke={accent} strokeWidth="2.5" />
            <line x1="32" y1="4" x2="32" y2="12" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32" cy="4" r="2.5" fill={accent} />
            <ellipse cx="24" cy={eyes.cy} rx={eyes.rx} ry={eyes.ry} fill={accent} />
            <ellipse cx="40" cy={eyes.cy} rx={eyes.rx} ry={eyes.ry} fill={accent} />
            <path d={MOUTHS[state]} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

export default MakerAvatar;
```

- [ ] **Step 6: Render it in `MakerKiosk`**

In `src/components/MakerKiosk.tsx`, import both modules:

```tsx
import { MakerAvatar } from './MakerAvatar';
import { makerAvatarState } from './makerAvatarState';
```

There is no single "current answer" — the component holds `messages: ChatMessage[]`, and each assistant message carries its own optional `answer` (see the `ChatMessage` type around line 29). So the face belongs to each answer, inside `AssistantAnswer` at line 308. Change its header line from:

```tsx
function AssistantAnswer({ answer }: { answer: MakerAnswer }) {
    return (
        <div ...>
            <strong style={{ fontSize: 18 }}>{answer.title}</strong>
```

to:

```tsx
function AssistantAnswer({ answer }: { answer: MakerAnswer }) {
    return (
        <div ...>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MakerAvatar state={makerAvatarState(answer)} size={40} />
                <strong style={{ fontSize: 18 }}>{answer.title}</strong>
            </div>
```

Leave the rest of the component untouched, and leave the large idle robot glyph on the empty state as it is — `makerAvatarState(null)` returns `"waving"` if you later want to drive that one too.

- [ ] **Step 7: Verify in the real app**

With the dev server running, open `http://127.0.0.1:5199/?display=kiosk`, tap **Ask**, and send in order: `hi`, `where is the hot glue gun`, `how do I use a soldering iron`, `qqqqqq`. Confirm the face changes to waving, cheerful, serious, thinking.

- [ ] **Step 8: Full verification**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: no type errors, no lint output, all tests pass

- [ ] **Step 9: Commit**

```bash
git add src/components/makerAvatarState.ts src/components/makerAvatarState.test.ts src/components/MakerAvatar.tsx src/components/MakerKiosk.tsx
git commit -m "feat(kiosk): give the Maker Bot an expression"
```

---

## Verification

After all seven tasks:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Then drive the real app as in the 2026-08-16 sweep: launch Chrome headless against `?display=kiosk`, screenshot Find / Ask / Map plus an out-of-stock card and the request confirmation, and read every screenshot. Also open `/` and confirm the staff tab shell is visually unchanged.
