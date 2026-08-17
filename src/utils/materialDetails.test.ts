import assert from "node:assert/strict";
import type { Material } from "../types";
import {
    enrichMaterial,
    isMaterialAvailable,
    kioskDescription,
    materialStockLabel,
    parseMaterialDescription,
    parseStockStatus,
} from "./materialDetails.ts";

function makeMaterial(overrides: Partial<Material>): Material {
    return {
        id: "mat-1",
        name: "Test Material",
        description: "",
        quantity: 0,
        unit: "items",
        compartmentId: "vivi-shelving",
        createdAt: "2026-07-09T15:15:00.000Z",
        ...overrides,
    };
}

// Full import-style dump: every known key plus leftovers.
const parsed = parseMaterialDescription(
    "Category: Materials; Where to find it: Paper Station, Upcycled; " +
    "Packed in/moved to: Box 4; Stock status: In Stock; Able to Cricut: yes; " +
    "Supplier: Donation; Used for: origami workshops",
);

assert.equal(parsed.category, "Materials");
assert.equal(parsed.location, "Paper Station, Upcycled");
assert.equal(parsed.storage, "Box 4");
assert.equal(parsed.stockStatus, "in-stock");
assert.equal(parsed.cricut, true);
assert.equal(parsed.supplier, "Donation");
assert.equal(parsed.description, "Used for: origami workshops");

// Values containing periods/commas stay intact; unknown keys are kept.
const findings = parseMaterialDescription(
    "Category: Findings. Hardware; Kit: Lego Mindstorm; Stock status: Low",
);
assert.equal(findings.category, "Findings. Hardware");
assert.equal(findings.description, "Kit: Lego Mindstorm");
assert.equal(findings.stockStatus, "low");

// "Move to" is an alias for storage; repeated keys are joined.
const moved = parseMaterialDescription("Packed in/moved to: Box 2; Move to: VVP 9");
assert.equal(moved.storage, "Box 2, VVP 9");

// Plain descriptions pass through untouched.
const plain = parseMaterialDescription("2m HDMI cable");
assert.equal(plain.description, "2m HDMI cable");
assert.equal(plain.category, undefined);

assert.equal(parseStockStatus("In Stock"), "in-stock");
assert.equal(parseStockStatus("Out of Stock"), "out-of-stock");
assert.equal(parseStockStatus("Wishlist"), "wishlist");
assert.equal(parseStockStatus("2 missing"), "missing");
assert.equal(parseStockStatus("banana"), undefined);

// enrichMaterial lifts fields and cleans the description.
const enriched = enrichMaterial(makeMaterial({
    description: "Category: Kitchen Tools; Packed in/moved to: Box 8",
}));
assert.equal(enriched.category, "Kitchen Tools");
assert.equal(enriched.storage, "Box 8");
assert.equal(enriched.description, "");

// Already-structured materials are returned unchanged.
const preEnriched = makeMaterial({ category: "Electronics", description: "Stock status: Low" });
assert.equal(enrichMaterial(preEnriched), preEnriched);

// Plain materials are returned unchanged.
const plainMaterial = makeMaterial({ description: "2m HDMI cable" });
assert.equal(enrichMaterial(plainMaterial), plainMaterial);

// Availability: count wins, then stock status.
assert.equal(isMaterialAvailable(makeMaterial({ quantity: 3 })), true);
assert.equal(isMaterialAvailable(makeMaterial({ quantity: 0 })), false);
assert.equal(isMaterialAvailable(makeMaterial({ quantity: 0, stockStatus: "in-stock" })), true);
assert.equal(isMaterialAvailable(makeMaterial({ quantity: 0, stockStatus: "low" })), true);
assert.equal(isMaterialAvailable(makeMaterial({ quantity: 0, stockStatus: "out-of-stock" })), false);
assert.equal(isMaterialAvailable(makeMaterial({ quantity: 0, stockStatus: "wishlist" })), false);

assert.equal(materialStockLabel(makeMaterial({ quantity: 12, unit: "pcs" })), "12 pcs");
assert.equal(materialStockLabel(makeMaterial({ quantity: 0, stockStatus: "in-stock" })), "In stock");
assert.equal(materialStockLabel(makeMaterial({ quantity: 0, stockStatus: "low" })), "Low stock");
assert.equal(materialStockLabel(makeMaterial({ quantity: 0 })), "Out of stock");

console.log("materialDetails tests passed");

// Kid-facing cards currently render the raw description, which is a merged blob
// of staff fields. Children have been shown purchase remarks, loan history and
// raw Notion URLs. This is an allowlist, not a denylist: free-text staff data
// guarantees a denylist leaks the next key nobody anticipated.

// The one keyed field a child benefits from.
assert.equal(
    kioskDescription("Used for: paper, plastic, wood"),
    "paper, plastic, wood",
);

// Staff fields are dropped.
assert.equal(kioskDescription("Purchase remarks: Comes with 4 mini tubes, Red label"), "");
assert.equal(kioskDescription("Loan period: March 30, 2022 → May 22, 2022"), "");
assert.equal(kioskDescription("Loaned to: External Site_ Hebron"), "");
assert.equal(kioskDescription("Kit: Leather Kit"), "");

// Unrecognised keys are dropped too — that is the point of an allowlist.
assert.equal(kioskDescription("Procurement notes: reorder in April"), "");

// Anything carrying a URL is dropped whatever its key.
assert.equal(
    kioskDescription("Specific materials: Calico Fabric (https://app.notion.com/p/Calico-abc?pvs=21)"),
    "",
);
assert.equal(kioskDescription("Used for: see https://example.com/guide"), "");

// A mixed blob keeps only the child-facing part.
assert.equal(
    kioskDescription(
        "Used for: paper, plastic; Specific materials: Pom Poms (https://app.notion.com/p/x); Purchase remarks: 30 sticks",
    ),
    "paper, plastic",
);

// A plain keyless description is a genuine human sentence, not a staff field,
// so it survives — unless it carries a URL.
assert.equal(kioskDescription("Cat 6 networking cable"), "Cat 6 networking cable");
assert.equal(kioskDescription("See https://example.com"), "");

// Empty input stays empty rather than throwing.
assert.equal(kioskDescription(""), "");
assert.equal(kioskDescription("   "), "");
assert.equal(kioskDescription(";;"), "");

console.log("kioskDescription tests passed");
