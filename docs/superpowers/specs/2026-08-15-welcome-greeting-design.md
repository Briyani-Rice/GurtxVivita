# Welcome greeting

## Goal

Greet the person by name on the Welcome tab when they are signed in, and fall
back to a generic greeting when they are not.

- Signed out: `Hi, user!`
- Signed in: `Hi, <name>!`

The greeting sits above the `welcome.heading` line, as a muted lead-in. It does
not replace the venue heading.

## Name resolution

New module `src/services/greetingName.ts` exporting one pure function:

```ts
greetingName(account: AccountRecord | null): string | null
```

It returns the **first whitespace-separated word** of `account.label`, or `null`
when there is no usable name. `null` means the caller renders the guest
greeting.

Only the first word is shown. This is a deliberate product choice: it reads as
friendlier. It is wrong for names written family-name-first (`Le Son Tung`
renders as `Hi, Le!`), which was raised and accepted during design.

`label` is assigned upstream in `app.tsx` as
`displayName || email || "Google account"`, so two labels are not names and must
not be greeted:

| `label`                       | Result   | Rendered      |
| ----------------------------- | -------- | ------------- |
| `"Le Son Tung"`               | `"Le"`   | `Hi, Le!`     |
| `"Jane"`                      | `"Jane"` | `Hi, Jane!`   |
| `"  Jane  Smith "`            | `"Jane"` | `Hi, Jane!`   |
| `"le_son_tung@example.com"`   | `null`   | `Hi, user!`   |
| `"Google account"`            | `null`   | `Hi, user!`   |
| `""` / whitespace             | `null`   | `Hi, user!`   |
| `null` (signed out)           | `null`   | `Hi, user!`   |

An email is detected by the presence of `@`. `"Google account"` is matched
case-insensitively after trimming.

The module imports only the `AccountRecord` type, keeping it runnable under
plain `tsx` with no Firebase or Tauri imports, per the project's test
conventions.

## Translation

Two keys, added to all five dictionaries (`en`, `zh`, `ja`, `ms`, `ta`):

- `welcome.greeting` — `"Hi, {name}!"`
- `welcome.guestName` — `"user"`

The signed-out state renders as
`t("welcome.greeting", { name: t("welcome.guestName") })`, so each language
translates word order, punctuation, and honorifics exactly once. Japanese uses
`こんにちは、{name}さん！`, which reads correctly with both a real name and the
guest word.

The existing `i18n.test.ts` already asserts that every language covers exactly
the English key set and that `{placeholders}` survive translation, so both new
keys are enforced across all languages without new i18n tests.

## Rendering

In the Welcome tab in `src/app.tsx`, a new line above the `<h1>`, styled as
muted secondary text consistent with `welcome.sub`.

The current account is held in component state, seeded from
`loadCurrentAccount()` and refreshed on the existing `ACCOUNT_SESSION_EVENT`
window event. That event is already broadcast by both `recordAccountLogin` and
`clearCurrentAccount` in `accountSession.ts`, so the greeting flips on sign-in
and sign-out without a reload. The listener is removed on unmount.

## Tests

`src/services/greetingName.test.ts`, in the project's plain `node:assert` style,
covering every row of the table above.

No new i18n test is needed — key parity and placeholder survival are already
enforced.

## Out of scope

- Greeting anywhere other than the Welcome tab.
- Time-of-day greetings ("Good morning").
- Changing how `label` is assigned at login.
