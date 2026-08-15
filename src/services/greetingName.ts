import type { AccountRecord } from "./accountSession";

// app.tsx records the account label as `displayName || email || "Google
// account"`, so a label is not always a name. Greeting those fallbacks would
// render "Hi, someone@example.com!" or "Hi, Google account!".
const GENERIC_LABEL = "google account";

// Returns the name to greet, or null when the account has nothing worth
// greeting — the caller then shows the generic guest greeting.
//
// Only the first word is used. That reads as friendlier, and is knowingly wrong
// for names written family-name-first ("Le Son Tung" greets as "Le"); see
// docs/superpowers/specs/2026-08-15-welcome-greeting-design.md.
export function greetingName(account: AccountRecord | null): string | null {
    const label = (account?.label ?? "").trim();

    if (!label || label.includes("@") || label.toLowerCase() === GENERIC_LABEL) {
        return null;
    }

    return label.split(/\s+/)[0] ?? null;
}
