# Admin User Guide

This guide is for makerspace staff. It covers everything you need to keep the
Maker Bot's answers accurate — no developer help needed.

## 1. Logging in

1. Open the **Login** tab (command bar → `Login`).
2. Sign in with your staff Google account, or use the demo account
   (`User` / `User12345`) on a local prototype build.
3. After login the app opens **Admin View**. Only accounts listed in the
   `VITE_FIREBASE_ADMIN_EMAILS` allowlist get admin access; everyone else
   signs in as a basic user.

The child-facing tablet never needs a login.

## 2. Managing materials, tools, and equipment

In **Admin View**, pick a storage area on the left, then:

- **Add Material** — creates a new inventory item in that area.
- **Pencil icon** — edits an existing item.
- **Trash icon** — removes an item (you will be asked to confirm).

Each material has:

| Field | What it does |
|---|---|
| Name, Description | What children see when they ask the Maker Bot about it |
| Quantity, Unit | Stock level; drives the in/low/out-of-stock badges |
| Compartment | Where the item lives — the Maker Bot uses this to answer "where is…" |
| How to use it | Step-by-step instructions, one step per line, in child-friendly language |
| Image link / Video link | Optional media shown with usage answers |
| Needs adult supervision | Safety flag — see below |

Changes sync to the Maker Bot in near real time through the cloud database.

## 3. Safety flagging

Tick **Needs adult supervision** on any tool that children must not use alone
(hot glue guns, soldering irons, cutters…). When a child asks about a flagged
tool, the Maker Bot shows a prominent warning **before** any instructions:

> "This tool needs an adult to help you. Please ask a staff member before using it."

Untick the box to unflag a tool. The flag you set always wins over the app's
built-in keyword guesses.

## 4. Project ideas

The **Project Ideas** panel (right side of Admin View) manages what the Maker
Bot suggests when a child asks "what can I make?".

- **Add Idea** — name, a one-sentence summary, difficulty (Starter / Builder /
  Challenge), the steps, and the materials/tools the idea needs.
- Link every idea to its required items — the Maker Bot uses those links to
  match ideas to what the child asked about.
- Edit or delete ideas with the pencil / trash icons.

## 5. Material requests

The **Review queue** shows requests submitted from the User View. **Approve**
reduces stock automatically; **Decline** rejects the request. Out-of-stock
items are listed at the bottom of the panel.

## 6. Tips for child-friendly content

- Keep sentences short. Readers may be as young as 8.
- Write instructions as actions: "Pick a sheet", "Ask a staff member".
- Always add the supervision flag first, then the instructions.
- Prefer a short video link over long text where you can.
