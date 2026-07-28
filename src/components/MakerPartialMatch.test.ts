import assert from "node:assert/strict";
import { answerMakerQuery, type MakerItem } from "./makerspaceData.ts";
import { materialToMakerItem } from "./inventoryStore.ts";

// Real Firestore materials only carry [name, description] as aliases (no
// hand-curated short aliases like the static seed items). Children rarely type
// an item's full name, so "where is the filament" must still find
// "3D Printer Filament". Before the partial-match fallback the matcher required
// the query to contain the item's ENTIRE name, so only certain items answered.
function mk(name: string, description = ""): MakerItem {
    return materialToMakerItem({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        description,
        quantity: 5,
        unit: "pcs",
        compartmentId: "pegboard-storage",
        createdAt: "2026-07-07T12:00:00.000Z",
    });
}

const filament = mk("3D Printer Filament", "PLA spool for the 3D printer");
const scissors = mk("Fabric Scissors");
const tape = mk("Masking Tape");
const items = [filament, scissors, tape];

// Partial name → still locates the item.
const partial = answerMakerQuery("where is the filament", items, []);
assert.equal(partial.intent, "locate", "partial name should still be a location lookup");
assert.equal(partial.item?.id, filament.id, "partial name 'filament' should resolve to 3D Printer Filament");

// Plural of a single-word component of the name.
const plural = answerMakerQuery("where are the scissors", items, []);
assert.equal(plural.item?.id, scissors.id, "'scissors' should resolve to Fabric Scissors");

// "how do I use" a partially-named item routes to instructions, not unknown.
const use = answerMakerQuery("how do I use the tape", items, []);
assert.equal(use.intent, "use", "partial name with a use word should give instructions");
assert.equal(use.item?.id, tape.id, "'tape' should resolve to Masking Tape");

// Specificity must still hold: a full-name match beats a partial word overlap.
const specific = answerMakerQuery("where is the 3d printer filament", items, []);
assert.equal(specific.item?.id, filament.id, "full name should still resolve exactly");

// A query that shares no meaningful word with any item stays unknown so the
// Groq fallback can take over.
const none = answerMakerQuery("where is the anvil", items, []);
assert.equal(none.intent, "unknown", "unrelated query should not force a false match");

console.log("MakerPartialMatch tests passed");
