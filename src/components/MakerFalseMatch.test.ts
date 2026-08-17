import assert from "node:assert/strict";
import { answerMakerQuery, makerspaceItems, projectIdeas, type MakerItem } from "./makerspaceData.ts";
import { materialToMakerItem } from "./inventoryStore.ts";

// The bot used to answer nonsense with a confident "Found: <item>", which is
// worse than saying it does not know: a child is sent to a shelf for something
// they never asked about. Two separate matching rules were too loose.
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

// A real Firestore item whose name contains the short word "non".
const heatTransfer = mk("Heat Transfer A4R Paper CPM 6.2 (For non-fabric smooth surfaces)");
const colouredPaper = mk("Coloured Paper", "Assorted colours");
const items = [...makerspaceItems, heatTransfer, colouredPaper];

// Tier 2 (word overlap) used an unbounded prefix match in either direction, so
// a long query word matched any short item word that happened to start it:
// "nonsense" ~ "non" (from "non-fabric").
for (const gibberish of ["asdkjhqwe zzz nonsense", "nonsense", "blah blah blah", "xyzzy plugh"]) {
    const answer = answerMakerQuery(gibberish, items, projectIdeas);
    assert.equal(answer.intent, "unknown", `"${gibberish}" must not match an item`);
}

// Tier 1 (full alias in query) used a raw substring test, so an alias matched
// inside a longer word: "papercut" contains "paper".
const papercut = answerMakerQuery("papercut", items, projectIdeas);
assert.equal(papercut.intent, "unknown", "'papercut' must not resolve to Coloured Paper");

// The suffix tolerance that makes plurals work is still there.
for (const [query, expected] of [
    ["where are the leds", "LED Lights"],
    ["scissors", "Safety Scissors"],
    ["where is the hot glue gun", "Hot Glue Gun"],
] as const) {
    const answer = answerMakerQuery(query, makerspaceItems, projectIdeas);
    assert.equal(answer.item?.name, expected, `"${query}" should still resolve to ${expected}`);
}

// Multi-word aliases still match mid-sentence, where both edges are spaces.
const midSentence = answerMakerQuery("hi, where is the hot glue gun please?", makerspaceItems, projectIdeas);
assert.equal(midSentence.item?.name, "Hot Glue Gun");

// An exact whole-word hit on a short name is still a match — the boundary rule
// must not throw away legitimate short names.
const shortName = answerMakerQuery("where is the paper", [colouredPaper], projectIdeas);
assert.equal(shortName.item?.name, "Coloured Paper");

console.log("MakerFalseMatch tests passed");
