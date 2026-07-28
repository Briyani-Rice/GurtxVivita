import assert from "node:assert/strict";
import { answerMakerQuery, type MakerItem } from "./makerspaceData.ts";
import { materialToMakerItem } from "./inventoryStore.ts";

// Inventory can be added in any language. Before the Unicode-aware normalize
// fix, normalize() stripped every non-[a-z0-9:+] character, so a Chinese-named
// material collapsed to an empty string and could NEVER be matched — the Maker
// Bot silently only answered for Latin-named (e.g. the English demo) items.
function mk(name: string, description = ""): MakerItem {
    return materialToMakerItem({
        id: name,
        name,
        description,
        quantity: 5,
        unit: "pcs",
        compartmentId: "pegboard-storage",
        createdAt: "2026-07-07T12:00:00.000Z",
    });
}

const cardboard = mk("纸箱", "硬纸板箱");        // cardboard box
const paper = mk("彩色纸", "各种颜色的纸");        // coloured paper
const filament = mk("3D Printer Filament", "PLA spool");
const items = [cardboard, paper, filament];

// A Chinese item name embedded in a Chinese question must locate the item.
const zhWhere = answerMakerQuery("纸箱在哪里", items, []);
assert.equal(zhWhere.intent, "locate", "Chinese location query should locate the item");
assert.equal(zhWhere.item?.id, cardboard.id, "'纸箱在哪里' should resolve to 纸箱");

// Mixed-script query (English scaffolding + Chinese item name) also works.
const mixed = answerMakerQuery("where is the 彩色纸", items, []);
assert.equal(mixed.item?.id, paper.id, "mixed-script query should resolve to 彩色纸");

// Latin matching is unchanged by the Unicode-aware normalize.
const en = answerMakerQuery("where is the filament", items, []);
assert.equal(en.item?.id, filament.id, "English partial match must still work");

// An unrelated Chinese query stays unknown so the fallback can take over.
const none = answerMakerQuery("锤子在哪里", items, []);
assert.equal(none.intent, "unknown", "unrelated Chinese query should not force a false match");

console.log("MakerUnicodeMatch tests passed");
