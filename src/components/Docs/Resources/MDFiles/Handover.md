# Handover & Maintenance Guide

For whoever runs or inherits Viventory after the student team hands it over.

## What you need

- **Firebase project** (free Spark tier) with:
  - Firestore enabled, collections `materials`, `materialRequests`,
    `projectIdeas` (created automatically on first write).
  - Authentication → Google provider enabled.
- **Env file** (`.env.local`) with the Firebase web app keys — see the README
  (`VITE_FIREBASE_*`) — and `VITE_FIREBASE_ADMIN_EMAILS` listing staff Google
  accounts that should get admin access.
- Node.js 20+ to build; Rust + Cargo only if you build the Tauri desktop app.

## Running and deploying

```bash
npm install
npm run dev        # local web app
npm run build      # production web build (dist/)
npm run tauri dev  # desktop kiosk shell
```

Deploy the `dist/` folder to any static host (Firebase Hosting free tier
works well). On the kiosk tablet, open the app and press F11 (or the
fullscreen button) for kiosk mode.

## Routine content maintenance

Everything content-related is done in **Admin View** — no code changes:

- inventory items, locations, quantities
- usage instructions and image/video links
- adult-supervision safety flags
- project ideas and their required materials

See the **Admin User Guide** for step-by-step instructions.

## Seeding / bulk import

`scripts/seedFirestoreMaterials.ts` uploads the starter inventory list into
Firestore. Re-run it only on a fresh database — it does not deduplicate.

## Checks before handing to users

```bash
npm test           # runs every *.test.ts under src/
npm run build      # type-checks and builds
```

Both must pass. The tests cover the chatbot rules, safety flagging,
inventory merging, and the admin content-management wiring.

## Recurring costs

None at current scale. Firebase Spark tier covers Firestore, Auth, and
Hosting for a single makerspace. If usage ever exceeds the free quotas,
Firebase bills pay-as-you-go — set a budget alert in the Firebase console.

## Known limitations

- Online-only: no offline mode (per requirements).
- The chatbot is rule-based; it matches item names/aliases and a fixed set of
  intent keywords. New items are matched automatically from their name and
  description.
- Demo username/password login (`User` / `User12345`) is for local prototypes;
  remove it from `src/types.ts` (`User.DEMO_ACCS`) before a real deployment.
