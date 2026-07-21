import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./LoginTab.tsx", import.meta.url), "utf8");

assert.match(
    source,
    /import \{ UserViewTab \} from "\.\/UserViewTab"/,
    "LoginTab should be able to open User View after a regular login",
);

assert.match(
    source,
    /targetName = isAdmin \? "Admin View" : "User View"/,
    "LoginTab should find an existing User View tab for regular users",
);

assert.match(
    source,
    /loginTabId/,
    "LoginTab should remove itself by stable tab id instead of stale tab index",
);

assert.match(
    source,
    /setTabs\(\(prevTabs\)/,
    "LoginTab should route using live tab state",
);

assert.match(
    source,
    /new UserViewTab\(\)/,
    "LoginTab should create User View when regular users log in and the tab is missing",
);

assert.doesNotMatch(
    source,
    /}\s*else\s*{\s*setTabs\(tabsWithoutLogin\);\s*setTabIndex\(0\);/s,
    "Regular login should not dump users back onto the Welcome tab",
);

assert.doesNotMatch(
    source,
    /getCUsrname\(\)[\s\S]*setTabIndex\(0\)/,
    "LoginTab should not close itself to the Welcome tab based on stale native username state",
);

console.log("LoginTab routing source checks passed");
