import assert from "node:assert/strict";
import { Language, type Material } from "../types";
import {
    DICTIONARIES,
    translate,
    translateTabName,
    translateSettingsPageName,
    translatedStockLabel,
} from "./i18n.ts";

const englishKeys = Object.keys(DICTIONARIES[Language.English]).sort();
assert.ok(englishKeys.length > 0, "English dictionary must not be empty");

// Every language must cover exactly the same keys as English, so no view
// shows a mix of languages after switching.
for (const language of Object.values(Language)) {
    const keys = Object.keys(DICTIONARIES[language]).sort();
    assert.deepEqual(
        keys,
        englishKeys,
        `Dictionary for ${language} is missing or has extra keys`,
    );
}

// Placeholders like {count} must survive in every translation that has them.
for (const key of englishKeys) {
    const placeholders = [...DICTIONARIES[Language.English][key].matchAll(/\{(\w+)\}/g)]
        .map(match => match[1])
        .sort();

    for (const language of Object.values(Language)) {
        const translatedPlaceholders = [...DICTIONARIES[language][key].matchAll(/\{(\w+)\}/g)]
            .map(match => match[1])
            .sort();
        assert.deepEqual(
            translatedPlaceholders,
            placeholders,
            `Placeholders differ for "${key}" in ${language}`,
        );
    }
}

assert.equal(translate(Language.English, "user.shown", { count: 5 }), "5 shown");
assert.equal(translate(Language.Chinese, "user.shown", { count: 5 }), "显示 5 项");
assert.equal(translate(Language.Chinese, "tab.Settings"), "设置");

assert.equal(translateTabName(Language.Japanese, "User View"), "ユーザービュー");
// Unknown tab names (custom tabs) fall back to the raw name.
assert.equal(translateTabName(Language.Japanese, "Mystery Tab"), "Mystery Tab");

assert.equal(translateSettingsPageName(Language.Malay, "Account"), "Akaun");
assert.equal(translateSettingsPageName(Language.Malay, "Unknown"), "Unknown");

const material: Material = {
    id: "mat-1",
    name: "Test",
    description: "",
    quantity: 0,
    unit: "pcs",
    compartmentId: "vivi-shelving",
    createdAt: "2026-07-09T15:15:00.000Z",
    stockStatus: "in-stock",
};

assert.equal(translatedStockLabel(Language.Tamil, material), "கையிருப்பில் உள்ளது");
assert.equal(translatedStockLabel(Language.English, { ...material, quantity: 4 }), "4 pcs");
assert.equal(translatedStockLabel(Language.English, { ...material, stockStatus: undefined }), "Out of stock");

console.log("i18n tests passed");
