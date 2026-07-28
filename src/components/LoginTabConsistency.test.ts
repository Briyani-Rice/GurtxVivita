import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const loginSource = readFileSync(new URL("./LoginTab.tsx", import.meta.url), "utf8");
const authSource = readFileSync(new URL("../services/firebaseAuth.ts", import.meta.url), "utf8");

assert.match(
    authSource,
    /getGoogleLoginAvailability/,
    "Firebase auth should make web/desktop availability decisions through one pure helper",
);

assert.match(
    authSource,
    /getCurrentGoogleLoginAvailability/,
    "Firebase auth should expose the same structured availability result used by sign-in",
);

assert.match(
    loginSource,
    /getCurrentGoogleLoginAvailability/,
    "LoginTab should consume the auth service's single structured availability result",
);

assert.doesNotMatch(
    loginSource,
    /useEffect/,
    "LoginTab should not patch inconsistent availability with a one-shot mount effect",
);

assert.equal(
    loginSource.match(/\.\.\.loginActionStyle/g)?.length,
    2,
    "Demo and Google login buttons should share the same dimensions and typography",
);

assert.match(
    loginSource,
    /googleLoading\s*\?\s*t\("login\.googleOpening"\)\s*:\s*t\("login\.google"\)/s,
    "The Google action should keep one stable label when it is not loading",
);

assert.match(
    loginSource,
    /googleLoginAvailability\.reason/,
    "Unavailable Google login should show configuration guidance separately from its action label",
);

assert.match(
    loginSource,
    /background:\s*"#fff",\s*color:\s*"#24262B"/s,
    "The white Google button should keep a dark, readable label in both light and dark appearance modes",
);

console.log("LoginTab consistency source checks passed");
