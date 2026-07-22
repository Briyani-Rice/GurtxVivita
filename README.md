# Viventory

Viventory is a VIVITA makerspace inventory and guidance prototype. It helps young makers find materials, learn how to use tools safely, and discover project ideas through a child-facing tablet kiosk, while staff can manage inventory and requests through an authenticated admin view.

The app is built as a Vite + React frontend with a Tauri desktop shell.

## Features

- Child-facing Maker Bot kiosk for finding items, learning safe usage, and getting project ideas.
- Interactive room map for locating storage areas and checking material quantities.
- User view for searching materials and submitting requests.
- Admin view for adding, editing, and deleting materials, including usage instructions, image/video links, and the adult-supervision safety flag.
- Admin-managed project ideas linked to the materials they need, synced to the Maker Bot in near real time.
- Admin request queue for approving or declining material requests.
- Documentation tab with in-app Markdown docs.
- Appearance settings for light, dark, or system theme, font size, and language.
- Demo admin login: `User` / `User12345`.

## Maker Bot

The `Maker Bot` tab is designed for a dedicated makerspace tablet. Children can use large quick-start buttons or type a question such as:

- `Where is the hot glue gun?`
- `How do I use a micro:bit?`
- `What can I make with cardboard and LEDs?`

The current implementation is rule-based rather than API-powered, which keeps the prototype free to run and ensures safety warnings appear predictably before instructions for adult-supervision tools.

The Maker Bot supports the core requirements from the makerspace user requirements document:

- Locate materials, tools, and equipment by zone and shelf.
- Explain usage steps in simple, age-appropriate language.
- Suggest project ideas from available materials.
- Show a clear adult-supervision warning before instructions for tools such as soldering irons and hot glue guns.
- Fall back to asking a staff member when it cannot answer safely.

## Admin Access

Open the `Login` command and use the demo staff account:

```text
Username: User
Password: User12345
```

After login, the app opens `Admin View`, where staff can:

- Add, edit, and delete materials.
- Edit each material's usage instructions and attach image or video links.
- Flag or unflag tools as needing adult supervision (the Maker Bot shows the safety warning before instructions).
- Add, edit, and delete project ideas and link them to required materials/tools.
- Review pending material requests.
- Approve requests and reduce stock quantities.
- Decline requests.
- See out-of-stock items.

Materials, requests, and project ideas are stored in Firestore (`materials`, `materialRequests`, and `projectIdeas` collections) and streamed live with `onSnapshot`, so admin edits reach the kiosk in near real time. See the in-app Documentation tab for the Admin User Guide, Technical Architecture, and Handover & Maintenance Guide.

## Firebase Google Login

The login screen also supports Firebase Authentication with Google sign-in. In Firebase Console, create a web app and enable the Google provider under Authentication.

Create a local env file with your Firebase web app values:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_ADMIN_EMAILS=admin@example.com,another-admin@example.com
```

Only Google accounts listed in `VITE_FIREBASE_ADMIN_EMAILS` open `Admin View`; other Google accounts sign in as basic users. The demo username/password login remains available for local prototype use.

## Running The App

Install dependencies:

```bash
npm install
```

Run as a web app:

```bash
npm run dev
```

Run as a desktop app with Tauri:

```bash
npm run tauri dev
```

In the desktop app, press `F11`, press `Control` + `Command` + `F`, or use the fullscreen button in the top bar to toggle fullscreen mode. Fullscreen hides the custom top command/title bar so the app can run like a kiosk.

Build the frontend:

```bash
npm run build
```

## PocketBase Materials Storage

Admin material add, edit, delete, and request-approval stock updates are stored through PocketBase. By default, the app connects to:

```text
http://127.0.0.1:8090
```

To use another PocketBase server, create a local env file:

```bash
VITE_POCKETBASE_URL=https://your-pocketbase.example.com
```

Create a base collection named `materials` with these fields:

```text
name          text, required
description   text
quantity      number, required
unit          text, required
compartmentId text, required
```

For local prototype use, set the collection API rules to allow the admin app to list, view, create, update, and delete records. If PocketBase is not running, the admin view falls back to starter data and shows an error when staff try to save changes.

## Useful Checks

The project currently uses small source-level regression checks plus the production build:

```bash
node --experimental-strip-types src/services/pocketbaseMaterials.test.ts
node --experimental-strip-types src/components/AdminViewTabPocketBase.test.ts
node --experimental-strip-types src/utils/makerspaceAssistant.test.ts
node --experimental-strip-types src/components/MakerKiosk.test.ts
node --experimental-strip-types src/components/AdminView.test.ts
node --experimental-strip-types src/components/Settings/SettingsPages/Appearance.test.ts
npm run build
```

## Project Structure

```text
src/app.tsx                         Main tabbed app shell
src/components/MakerKiosk.tsx        Child-facing makerspace chatbot kiosk
src/components/makerspaceData.ts     Rule-based inventory, safety, and project idea data
src/components/RoomMap.tsx           Interactive makerspace map
src/components/AdminView.tsx         Staff inventory and request management
src/components/Settings/             Appearance settings and saved preferences
src/components/Docs/                 In-app Markdown documentation
```

## Notes

- Tauri desktop mode requires Rust and Cargo.
- This project is still a prototype, so some data is stored locally in component state or browser storage.
- Appearance preferences are saved in localStorage and reapplied when the app starts.
- Maker Bot data is currently seeded in code and can be moved to a cloud database such as Firebase or Supabase later.

## Project Links

- [TODO List](./TODO.md)
- [Contributor Covenant](./CODE_OF_CONDUCT.md)
