import assert from "node:assert/strict";
import {
    answerMakerQuery,
    makerspaceItems,
    projectIdeas,
} from "../components/makerspaceData.ts";

const locationAnswer = answerMakerQuery("Where can I find the hot glue gun?", makerspaceItems, projectIdeas);
assert.equal(locationAnswer.intent, "locate");
assert.ok(locationAnswer.title.includes("Hot Glue Gun"));
assert.ok(
    locationAnswer.sections.some(section => section.body.includes("Pegboard Storage")),
    "Location answer should include the storage area",
);

const usageAnswer = answerMakerQuery("How do I use the soldering iron?", makerspaceItems, projectIdeas);
assert.equal(usageAnswer.intent, "use");
assert.equal(usageAnswer.sections[0].kind, "safety");
assert.match(
    usageAnswer.sections[0].body,
    /adult/i,
    "Safety flagged tools should show an adult supervision warning before instructions",
);
assert.ok(
    usageAnswer.sections.some(section => section.body.includes("Tin the tip")),
    "Usage answer should include item instructions",
);

const projectAnswer = answerMakerQuery("What can I make with cardboard and LEDs?", makerspaceItems, projectIdeas);
assert.equal(projectAnswer.intent, "make");
assert.ok(projectAnswer.projects.length >= 1, "Project answers should include at least one project idea");
assert.ok(
    projectAnswer.projects.some(project => project.name === "Light-up Story Scene"),
    "Project suggestions should match available materials",
);

const fallbackAnswer = answerMakerQuery("Can I bake a cake here?", makerspaceItems, projectIdeas);
assert.equal(fallbackAnswer.intent, "unknown");
assert.match(fallbackAnswer.sections[0].body, /staff member/i);

// A bare greeting gets a warm welcome rather than the safety fallback. Kids open
// the kiosk with "hi" constantly; routing that to "I could not find a safe
// answer" reads as a rebuff.
for (const hello of ["Hi", "hello!", "hey there", "Yo", "good morning", "Hi VIVI Bot"]) {
    const greeting = answerMakerQuery(hello, makerspaceItems, projectIdeas);
    assert.equal(greeting.intent, "greeting", `"${hello}" should be greeted`);
    assert.doesNotMatch(greeting.sections[0].body, /could not find/i);
    assert.ok(greeting.suggestedPrompts.length >= 1, "greeting should offer next steps");
}

// A greeting glued to a real question still answers the question.
const greetedQuestion = answerMakerQuery("hi, where is the hot glue gun?", makerspaceItems, projectIdeas);
assert.equal(greetedQuestion.intent, "locate");
assert.equal(greetedQuestion.item?.name, "Hot Glue Gun");

// "how are you" is conversational, not a greeting keyword, and must not be
// mistaken for one just because it is short.
assert.notEqual(answerMakerQuery("how are you", makerspaceItems, projectIdeas).intent, "greeting");

// The unknown fallback stays encouraging — it still points at staff, but must
// not tell a child their question was unsafe.
assert.doesNotMatch(fallbackAnswer.sections[0].body, /unsafe|not safe/i);

console.log("makerspaceAssistant tests passed");
