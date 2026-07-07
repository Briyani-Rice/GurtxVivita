import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const checkedFiles = [
    "../app.tsx",
    "../titlebar.tsx",
    "../titlestyle.css",
    "../CommandBar.tsx",
    "./Settings/Settings.tsx",
    "./Settings/SettingsPages/Appearance.tsx",
    "./LoginView.tsx",
    "./Chatbot/ChatBotView.tsx",
    "./MakerKiosk.tsx",
];

for (const file of checkedFiles) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");

    assert.doesNotMatch(
        source,
        /borderRadius:\s*["'](?:999px|1[2-9]px|2[0-9]px)["']|border-radius:\s*999px|rounded-(?:2xl|xl)/,
        `${file} should use cornered controls instead of bubbly surfaces`,
    );
}

for (const file of checkedFiles.filter(file => file !== "../app.tsx")) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");

    assert.doesNotMatch(
        source,
        /borderRadius:\s*["']100%["']|rounded-full/,
        `${file} should not use circular controls outside the tab bar`,
    );
}

const appSource = readFileSync(new URL("../app.tsx", import.meta.url), "utf8");
assert.match(
    appSource,
    /borderRadius:\s*"10px"/,
    "Tab items should keep their rounded tab style",
);

console.log("Corner style visual source checks passed");
