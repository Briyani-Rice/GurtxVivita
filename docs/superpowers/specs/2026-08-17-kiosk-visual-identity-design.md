# Kiosk visual identity

## Goal

Make the child-facing kiosk feel like a makerspace instead of an inventory
system, without touching the staff tooling.

The problem is not that the app is ugly. It is that a child meets 905 identical
white rectangles labelled in stock-control language, coloured with a single teal
that means nothing, and nothing on screen reacts to being touched.

Scope is the three kiosk surfaces only: `KioskShell`, `UserView` rendered in
kiosk mode, and `MakerKiosk`.

## Constraint that shapes everything

`src/components/VivitaPalette.test.ts` asserts that:

- the four VIVITA site colours (`#24262B`, `#A1824F`, `#A5D6D1`, `#33A7B5`)
  appear in both `style.css` and `appearancePreferences.ts`, and
- every light-mode surface token is exactly `#ffffff` — `--viventory-bg`,
  `--viventory-muted-surface`, `--viventory-welcome-bg`, `--viventory-shell-*`.

The flatness is deliberate and enforced. So the kiosk does **not** recolour the
global palette. It gets a second, additive token layer, and the staff shell keeps
its tested white.

## 1. Token layer

New `--vk-*` custom properties, defined in `style.css` under a
`.viventory-kiosk` class applied to the `KioskShell` root element. Scoping by
class rather than `:root` is what keeps the staff shell untouched and the
existing test passing.

Derived from the four brand colours, adding the three things the current palette
has no concept of:

| Token group | Purpose | Notes |
| --- | --- | --- |
| `--vk-ground`, `--vk-surface`, `--vk-surface-raised` | Warm paper ground and two elevation steps | Replaces flat white *inside the kiosk only* |
| `--vk-ink`, `--vk-ink-muted` | Text | From `#24262B` |
| `--vk-accent`, `--vk-accent-soft` | Primary action | From `#33A7B5` / `#A5D6D1` |
| `--vk-safe`, `--vk-caution`, `--vk-empty` | Semantic state | Standard use / needs an adult / none left. `--vk-caution` derives from `#A1824F` |
| `--vk-zone-1` … `--vk-zone-7` | The seven areas | Gives a zone a consistent identity across card, map, and answer |

Dark variants defined under `.viventory-kiosk[data-viventory-theme="dark"]`,
matching how the app already resolves theme onto the root element.

Rationale for the ground change: pure white is what makes the card grid read as
a spreadsheet. A warm paper ground lets a white card actually sit *on* something,
which is where visual hierarchy comes from — not from more colour.

## 2. Category identity

New module `src/utils/categoryIdentity.ts`, exporting one pure function:

```ts
categoryIdentity(categoryName: string): { icon: CategoryIconName; hue: number }
```

`hue` is a *category* colour and is unrelated to the `--vk-zone-*` tokens, which
identify the seven physical areas. A card can carry both: a category glyph in its
category hue, and a zone dot in its area colour.

Categories are staff-typed free text — `collectMaterialCategories` builds the
list from whatever is in the inventory, and the current data has 27 including
`"Findings. Hardware"` and `"VIVIPANEL supplies"`. A hardcoded map would go stale
the first time staff add a category, so:

1. **Keyword table** maps recognised words to a lucide icon and a fixed hue
   (`tool` → wrench, `adhesive` → droplet, `electronic` → cpu, `paper`/
   `material` → layers, `machine` → cog, `storage`/`packing` → box…).
2. **Deterministic fallback** for anything unrecognised: a stable hash of the
   lowercased name picks from a curated 8-hue set, so a brand-new category looks
   intentional on day one with no code change, and looks the *same* on every
   device and every reload.

The curated hue set is the point — a free hue from a hash produces colours that
clash with the brand. Choosing from a fixed harmonious set cannot.

The module imports only types and returns an icon *name*, not a component, so it
runs under plain `tsx` with no React import — consistent with the project's test
conventions.

## 3. Card content

Today the kiosk card renders `m.description` verbatim (`UserView.tsx:639`). That
field is a merged blob, so children currently read things like:

```
Purchase remarks: Comes with 4 mini tubes, Red label
Specific materials: Calico Fabric (https://app.notion.com/p/Calico-Fabric-abf82...)
Loan period: March 30, 2022 → May 22, 2022; Loaned to: Member
```

New pure function in `src/utils/materialDetails.ts`:

```ts
kioskDescription(description: string): string
```

An **allowlist**, not a denylist: it keeps only the `Used for:` segment and drops
everything else, including segments whose key it does not recognise. With
free-text staff data a denylist is guaranteed to leak the next unanticipated key;
an allowlist fails closed.

The kiosk card then shows: name, category glyph + colour, zone dot, stock state,
safety badge, and `kioskDescription` when non-empty. Nothing else. Purchase
remarks, suppliers, loan history, and Notion URLs stay in Admin View, which is
where staff actually work.

## 4. Stock voice

`materialStockLabel` currently ends the conversation with a grey `Out of stock`.
For a child that is a dead end with no way forward.

New pure function in `src/utils/materialSearch.ts`:

```ts
findSubstitutes(material: Material, all: Material[], limit = 3): Material[]
```

Returns in-stock materials sharing a category with the unavailable one, nearest
first by shared-category count, capped at `limit`. The card renders
*"none left right now — try these instead"* with those alternatives as tappable
chips.

This is the single change that most makes the app feel like it is on the child's
side, and it is pure logic over data already in memory — no new queries.

## 5. Motion and feedback

| Interaction | Today | After |
| --- | --- | --- |
| Any touch target | nothing | press-down scale + colour shift |
| Card appearing | instant | short staggered settle |
| Bot answer | full wall of text at once | sections reveal in sequence |
| Request submitted | static check + text for 800 ms | the same beat, animated, held to 1200 ms |

All CSS transitions, no animation library. Every rule sits inside a
`@media (prefers-reduced-motion: no-preference)` guard, so a child who needs
stillness gets the current instant behaviour rather than a degraded one.

The request confirmation already exists — `UserView.tsx:443` sets a `submitted`
state that renders a check and `user.requestSubmitted`, then closes on an 800 ms
timer. It is not missing, it is easy to miss: nothing moves, and 800 ms is
shorter than the glance it takes a child to look back up at the screen. This is a
change to an existing beat, not a new one.

## 6. Bot expression

`MakerAnswer` already carries `intent` and `item?.safetyLevel`. A pure mapping
turns those into one of four avatar states — no new data model, no new state:

| Condition | State |
| --- | --- |
| `intent === "greeting"` | waving |
| `item?.safetyLevel === "adult"` or a `safety` section present | serious |
| `intent === "unknown"` | thinking |
| otherwise | cheerful |

Rendered as inline SVG with the expression swapped by state, so it themes with
tokens and needs no image assets.

The serious state is a safety feature, not decoration: the supervision warning
currently looks exactly like every other block of text.

## 7. Tests

Plain `node:assert` + `tsx`, matching the project convention:

| File | Covers |
| --- | --- |
| `src/utils/categoryIdentity.test.ts` | keyword hits; fallback determinism (same name → same hue across calls); every hue within the curated set |
| `src/utils/materialDetails.test.ts` (extend) | `kioskDescription` keeps `Used for`, drops purchase remarks / loans / suppliers / URLs / unrecognised keys |
| `src/utils/materialSearch.test.ts` (extend) | `findSubstitutes` returns only in-stock, shares a category, respects `limit`, excludes the material itself |
| `src/components/MakerAvatar.test.ts` | the four-state mapping, including safety taking precedence over intent |

Visual and motion work is verified by driving the real kiosk in headless Chrome
and reading the screenshots, as done during the bug sweep on 2026-08-16.

## Out of scope

- The staff tab shell, Admin View, Settings, and Docs.
- The TV ambient board. It is genuinely broken — content crammed into the top
  40 % with centre-aligned bullet lists — and deserves its own pass rather than
  being smuggled into this one.
- Changing which display mode is the default front door. `?display=kiosk` still
  reaches the kiosk; "the device decides its mode at boot" stays the rule.
- Navigation changes. Find / Ask / Map stays exactly as it is.
- Fixing the corrupt inventory data (junk location strings, leaked Notion URLs at
  source). This spec hides it from children; it does not clean it.
