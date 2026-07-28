import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import {
    materialRequiresAdultSupervision,
    materialToMakerItem,
    parseProjectIdeaRecord,
} from "./inventoryStore.ts";

const compartments = [
    {
        id: "tinkering-studio",
        number: "TS",
        name: "Tinkering Studio",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        color: "#33A7B5",
    },
];

// Admins can flag a tool as needing adult supervision even when its name
// carries no risky keyword (doc 5.4: flag or unflag tools).
const flaggedItem = materialToMakerItem(
    {
        id: "embroidery-machine",
        name: "Embroidery Machine",
        description: "Stitching machine for fabric projects",
        quantity: 1,
        unit: "unit",
        compartmentId: "tinkering-studio",
        createdAt: "2026-07-22T12:00:00.000Z",
        safetyLevel: "adult",
    },
    compartments,
);
assert.equal(flaggedItem.safetyLevel, "adult", "Stored adult flag should reach the Maker Bot item");

// Admins can also unflag a tool whose name would otherwise trip keyword inference.
const unflaggedItem = materialToMakerItem(
    {
        id: "hot-wire-cutter",
        name: "Hot Wire Cutter",
        description: "Foam cutter",
        quantity: 1,
        unit: "unit",
        compartmentId: "tinkering-studio",
        createdAt: "2026-07-22T12:00:00.000Z",
        safetyLevel: "normal",
    },
    compartments,
);
assert.equal(unflaggedItem.safetyLevel, "normal", "Stored normal flag should override keyword inference");

assert.equal(
    materialRequiresAdultSupervision({
        id: "m1",
        name: "Embroidery Machine",
        description: "",
        quantity: 1,
        unit: "unit",
        compartmentId: "tinkering-studio",
        createdAt: "2026-07-22T12:00:00.000Z",
        safetyLevel: "adult",
    }),
    true,
    "Admin view should respect the stored adult-supervision flag",
);

// Admin-authored usage instructions and media links flow into the chatbot (doc 5.4 / FR-02).
const documentedItem = materialToMakerItem(
    {
        id: "vinyl-cutter",
        name: "Vinyl Sticker Roll",
        description: "Adhesive vinyl for the cutter",
        quantity: 5,
        unit: "rolls",
        compartmentId: "tinkering-studio",
        createdAt: "2026-07-22T12:00:00.000Z",
        instructions: ["Pick a colour you like.", "Ask staff to load it into the cutter."],
        imageUrl: "https://example.com/vinyl.jpg",
        videoUrl: "https://example.com/vinyl-howto",
    },
    compartments,
);
assert.deepEqual(
    documentedItem.instructions,
    ["Pick a colour you like.", "Ask staff to load it into the cutter."],
    "Stored usage instructions should replace the generic fallback steps",
);
assert.equal(documentedItem.imageUrl, "https://example.com/vinyl.jpg");
assert.equal(documentedItem.videoUrl, "https://example.com/vinyl-howto");

// Project ideas live in Firestore so staff can manage them without code changes (doc 5.4).
const idea = parseProjectIdeaRecord("idea-1", {
    name: "Sticker Story Jar",
    summary: "Decorate a jar with vinyl stickers.",
    difficulty: "Builder",
    requiredItemIds: ["vinyl-cutter", "scissors"],
    steps: ["Clean the jar.", "Cut sticker shapes.", "Stick and share."],
});
assert.equal(idea.id, "idea-1");
assert.equal(idea.name, "Sticker Story Jar");
assert.equal(idea.difficulty, "Builder");
assert.deepEqual(idea.requiredItemIds, ["vinyl-cutter", "scissors"]);
assert.deepEqual(idea.steps, ["Clean the jar.", "Cut sticker shapes.", "Stick and share."]);

const messyIdea = parseProjectIdeaRecord("idea-2", {
    name: "Mystery Make",
    difficulty: "not-a-real-level",
    requiredItemIds: "cardboard",
    steps: undefined,
});
assert.equal(messyIdea.difficulty, "Starter", "Unknown difficulty should fall back to Starter");
assert.deepEqual(messyIdea.requiredItemIds, [], "Non-array item links should be dropped safely");
assert.deepEqual(messyIdea.steps, [], "Missing steps should become an empty list");

// --- UI wiring source checks ---

const materialDialogSource = readFileSync(new URL("./MaterialDialog.tsx", import.meta.url), "utf8");
assert.match(materialDialogSource, /safetyLevel/, "Material dialog should let staff flag adult supervision");
assert.match(materialDialogSource, /instructions/, "Material dialog should let staff edit usage instructions");
assert.match(materialDialogSource, /imageUrl/, "Material dialog should accept an image link");
assert.match(materialDialogSource, /videoUrl/, "Material dialog should accept a video link");

assert.ok(
    existsSync(new URL("./ProjectIdeaDialog.tsx", import.meta.url)),
    "Admins need a dialog for adding and editing project ideas",
);

const adminViewSource = readFileSync(new URL("./AdminView.tsx", import.meta.url), "utf8");
assert.match(adminViewSource, /ProjectIdeaDialog/, "AdminView should open the project idea dialog");
assert.match(adminViewSource, /onDeleteProjectIdea/, "AdminView should let staff remove project ideas");
assert.match(
    adminViewSource,
    /materialRequiresAdultSupervision/,
    "AdminView should use the shared supervision check so stored flags win",
);

const providerSource = readFileSync(new URL("./InventoryProvider.tsx", import.meta.url), "utf8");
assert.match(providerSource, /projectIdeas/, "Inventory provider should share project ideas with the kiosk");
assert.match(providerSource, /addProjectIdea/, "Inventory provider should support adding project ideas");
assert.match(providerSource, /subscribe/, "Inventory should sync in near real time, not only on startup");

const inventoryServiceSource = readFileSync(new URL("../services/firebaseInventory.ts", import.meta.url), "utf8");
assert.match(inventoryServiceSource, /onSnapshot/, "Firestore changes should stream to the app (doc 5.4 near real time)");
assert.match(inventoryServiceSource, /projectIdeas/, "Project ideas should be stored in their own collection");

const kioskSource = readFileSync(new URL("./MakerKiosk.tsx", import.meta.url), "utf8");
assert.match(kioskSource, /inventory\.projectIdeas/, "Maker Bot should answer with staff-managed project ideas");
assert.match(kioskSource, /videoUrl/, "Maker Bot should surface video links with usage answers (FR-02)");

// --- Documentation deliverables (doc section 9) ---

for (const docFile of ["AdminGuide.md", "Architecture.md", "Handover.md"]) {
    assert.ok(
        existsSync(new URL(`./Docs/Resources/MDFiles/${docFile}`, import.meta.url)),
        `${docFile} should ship in the in-app documentation`,
    );
}

console.log("AdminContentManagement tests passed");
