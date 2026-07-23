import assert from "node:assert/strict";
import {
    answerMakerQuery,
    inferMakerSafety,
    type MakerItem,
} from "./makerspaceData.ts";

// A decoy item whose name is a shorter substring of the query must NOT win
// over the more specific item. With the real VIVITA inventory this is a
// safety issue: an un-flagged "Glue Gun" was matched for "hot glue gun",
// hiding the adult-supervision warning (requirements doc 5.2).
function item(overrides: Partial<MakerItem> & Pick<MakerItem, "id" | "name">): MakerItem {
    return {
        type: "tool",
        aliases: [],
        location: { zone: "Zone", shelf: "Shelf", detail: "Detail." },
        quantity: 1,
        unit: "pcs",
        description: "",
        safetyLevel: "normal",
        instructions: ["Step one."],
        imageHint: "",
        ...overrides,
    };
}

const decoy = item({ id: "decoy-glue-gun", name: "Glue Gun", aliases: ["glue gun"], safetyLevel: "normal" });
const real = item({
    id: "hot-glue-gun",
    name: "Hot Glue Gun",
    aliases: ["hot glue gun", "glue gun"],
    safetyLevel: "adult",
});

// Decoy is listed FIRST, so a first-match scanner would pick it.
const items = [decoy, real];

const useAnswer = answerMakerQuery("how do i use the hot glue gun", items, []);
assert.equal(useAnswer.item?.id, "hot-glue-gun", "Most specific alias should win over a shorter substring match");
assert.equal(
    useAnswer.sections[0]?.kind,
    "safety",
    "The adult-supervision warning must appear before instructions for the flagged tool",
);

const locateAnswer = answerMakerQuery("where is the hot glue gun", items, []);
assert.equal(locateAnswer.item?.id, "hot-glue-gun", "Location lookup should also prefer the most specific match");

const fabricDecoy = item({ id: "scissors", name: "Scissors", aliases: ["scissors"] });
const fabricReal = item({ id: "fabric-scissors", name: "Fabric Scissors", aliases: ["fabric scissors"] });
const fabricAnswer = answerMakerQuery("where are the fabric scissors", [fabricDecoy, fabricReal], []);
assert.equal(fabricAnswer.item?.id, "fabric-scissors", "Two-word item name should beat a one-word substring");

// Safety-forward default: any glue gun is adult-supervision unless staff unflag it.
assert.equal(
    inferMakerSafety("Glue Gun", "Cordless craft glue gun"),
    "adult",
    "Glue guns should default to adult supervision (doc 5.2 example)",
);
assert.equal(inferMakerSafety("Glue Stick", "Washable glue stick"), "normal", "Non-tool glue should stay normal");

// Item names that happen to contain an intent keyword as a substring
// ("Maker" -> "make", "Dowels" -> "do", "Project Box" -> "project") must
// still route "where is..." to a location answer, not to project ideas.
const trickyNames = ["Toki Maker", "Dowels", "Whyte Labs Project Box", "Idea Paint Pro"];
for (const name of trickyNames) {
    const tricky = item({ id: name.toLowerCase().replace(/\s+/g, "-"), name, aliases: [name.toLowerCase()], type: "material" });
    const located = answerMakerQuery(`where is the ${name}`, [tricky], []);
    assert.equal(
        located.intent,
        "locate",
        `"where is the ${name}" should be a location lookup even though the name contains an intent word`,
    );
    assert.equal(located.item?.id, tricky.id, `Location lookup should resolve to ${name}`);
}

console.log("MakerMatchSpecificity tests passed");
