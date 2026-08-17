import assert from "node:assert/strict";
import { makerAvatarState } from "./makerAvatarState.ts";
import { answerMakerQuery, makerspaceItems, projectIdeas } from "./makerspaceData.ts";

// The bot already knows what kind of answer it is giving. The face is a pure
// read of that, not new state.
assert.equal(makerAvatarState(null), "waving", "an idle bot is welcoming");

assert.equal(
    makerAvatarState(answerMakerQuery("hi", makerspaceItems, projectIdeas)),
    "waving",
);

assert.equal(
    makerAvatarState(answerMakerQuery("qqqqqq", makerspaceItems, projectIdeas)),
    "thinking",
    "an unknown answer should not look happy about it",
);

// Locating an ordinary material is cheerful.
assert.equal(
    makerAvatarState(answerMakerQuery("where is the cardboard", makerspaceItems, projectIdeas)),
    "cheerful",
);

// But locating a supervised tool is not. A child asking where the hot glue gun
// lives is about to go and use it, so the warning face belongs on the "where"
// answer too — not only on the "how do I use it" one.
assert.equal(
    makerAvatarState(answerMakerQuery("where is the hot glue gun", makerspaceItems, projectIdeas)),
    "serious",
);

// Safety wins over everything. A supervision warning currently looks exactly
// like any other block of text.
const soldering = answerMakerQuery("how do I use a soldering iron", makerspaceItems, projectIdeas);
assert.equal(makerAvatarState(soldering), "serious", "an adult-supervision answer must look serious");

// Safety beats intent even when the intent would otherwise be cheerful.
assert.equal(
    makerAvatarState({
        intent: "locate",
        title: "Found: Test",
        item: { ...makerspaceItems[0], safetyLevel: "adult" },
        sections: [],
        projects: [],
        suggestedPrompts: [],
    }),
    "serious",
);

console.log("makerAvatarState tests passed");
