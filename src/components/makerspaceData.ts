export type MakerItemType = "material" | "tool" | "equipment";

export interface MakerItem {
    id: string;
    name: string;
    type: MakerItemType;
    aliases: string[];
    location: {
        zone: string;
        shelf: string;
        detail: string;
    };
    quantity: number;
    unit: string;
    description: string;
    safetyLevel: "normal" | "adult";
    instructions: string[];
    imageHint: string;
    imageUrl?: string;
    videoUrl?: string;
}

export interface MakerProjectIdea {
    id: string;
    name: string;
    summary: string;
    difficulty: "Starter" | "Builder" | "Challenge";
    requiredItemIds: string[];
    steps: string[];
}

export type MakerIntent = "locate" | "use" | "make" | "inventory" | "unknown";

export interface MakerAnswerSection {
    kind: "answer" | "safety" | "steps" | "tip";
    title: string;
    body: string;
}

export interface MakerAnswer {
    intent: MakerIntent;
    title: string;
    item?: MakerItem;
    sections: MakerAnswerSection[];
    projects: MakerProjectIdea[];
    suggestedPrompts: string[];
}

export const makerspaceItems: MakerItem[] = [
    {
        id: "cardboard",
        name: "Cardboard Sheets",
        type: "material",
        aliases: ["cardboard", "cardboard sheet", "box board"],
        location: {
            zone: "White Space",
            shelf: "Low material shelf",
            detail: "Stacked flat beside the paper trays.",
        },
        quantity: 40,
        unit: "sheets",
        description: "Strong flat sheets for building structures and prototypes.",
        safetyLevel: "normal",
        instructions: [
            "Choose a sheet that is not bent or wet.",
            "Mark your shape with pencil before cutting.",
            "Use scissors for thin card or ask staff for help with thick board.",
            "Return unused pieces to the scrap tray so others can reuse them.",
        ],
        imageHint: "stacked sheets",
    },
    {
        id: "coloured-paper",
        name: "Coloured Paper",
        type: "material",
        aliases: ["coloured paper", "colored paper", "paper", "craft paper"],
        location: {
            zone: "White Space",
            shelf: "Paper drawers",
            detail: "Sorted by colour in the labelled drawers.",
        },
        quantity: 120,
        unit: "sheets",
        description: "Bright paper for sketches, labels, collage, and decorations.",
        safetyLevel: "normal",
        instructions: [
            "Pick the colour you need from the labelled drawer.",
            "Take only what your project needs.",
            "Use the paper cutter only if a staff member says it is okay.",
        ],
        imageHint: "colour swatches",
    },
    {
        id: "leds",
        name: "LED Lights",
        type: "material",
        aliases: ["led", "leds", "light", "lights"],
        location: {
            zone: "Tinkering Studio",
            shelf: "Electronics parts bins",
            detail: "Small clear bins near the micro:bit kits.",
        },
        quantity: 80,
        unit: "pcs",
        description: "Small lights for simple circuits and interactive projects.",
        safetyLevel: "normal",
        instructions: [
            "Check the long and short legs before connecting the LED.",
            "Use a resistor or a safe electronics kit connection.",
            "If it does not light up, flip the LED around and try again.",
        ],
        imageHint: "small electronic lights",
    },
    {
        id: "microbit",
        name: "micro:bit Kit",
        type: "equipment",
        aliases: ["microbit", "micro:bit", "micro bit", "coding board"],
        location: {
            zone: "Tinkering Studio",
            shelf: "Electronics cabinet",
            detail: "Blue labelled boxes beside the laptops.",
        },
        quantity: 12,
        unit: "kits",
        description: "A small coding board for sensors, lights, and simple inventions.",
        safetyLevel: "normal",
        instructions: [
            "Take one labelled kit and check that the cable is inside.",
            "Plug it into a laptop with the USB cable.",
            "Open the coding page shown on the kit card.",
            "Ask staff before connecting motors or external batteries.",
        ],
        imageHint: "coding board",
    },
    {
        id: "hot-glue-gun",
        name: "Hot Glue Gun",
        type: "tool",
        aliases: ["hot glue", "glue gun", "hot glue gun"],
        location: {
            zone: "Pegboard Storage",
            shelf: "Tool hooks",
            detail: "Hanging on the orange tool hook with glue sticks below.",
        },
        quantity: 4,
        unit: "tools",
        description: "A heated tool for joining cardboard, fabric, wood, and craft parts.",
        safetyLevel: "adult",
        instructions: [
            "Ask a staff member to plug in and supervise the glue gun.",
            "Place it on the heat-safe stand when not using it.",
            "Touch only the handle. The metal tip and glue are hot.",
            "Let glued parts cool before picking them up.",
        ],
        imageHint: "heated glue tool",
    },
    {
        id: "scissors",
        name: "Safety Scissors",
        type: "tool",
        aliases: ["scissors", "safety scissors", "cutting scissors"],
        location: {
            zone: "Work Tables",
            shelf: "Shared tool cups",
            detail: "In the blue cups in the middle of the work tables.",
        },
        quantity: 20,
        unit: "pairs",
        description: "Blunt-ended scissors for paper, thin card, and tape.",
        safetyLevel: "normal",
        instructions: [
            "Carry scissors with the closed blades pointing down.",
            "Cut slowly and keep fingers away from the blades.",
            "Return scissors to the blue cup after use.",
        ],
        imageHint: "safe cutting tool",
    },
    {
        id: "soldering-iron",
        name: "Soldering Iron",
        type: "tool",
        aliases: ["solder", "soldering", "soldering iron"],
        location: {
            zone: "Tinkering Studio",
            shelf: "Staff electronics bench",
            detail: "Stored behind the staff side of the electronics bench.",
        },
        quantity: 2,
        unit: "tools",
        description: "A high-heat tool used to join electronic parts.",
        safetyLevel: "adult",
        instructions: [
            "Ask a staff member before touching the soldering station.",
            "Tin the tip only when a staff member is supervising.",
            "Keep the hot iron in its stand whenever it is not touching the joint.",
            "Wash your hands after handling solder or electronics parts.",
        ],
        imageHint: "electronics heat tool",
    },
    {
        id: "camera-tripod",
        name: "Camera Tripod",
        type: "equipment",
        aliases: ["tripod", "camera tripod", "stand"],
        location: {
            zone: "VIVISTUDIO",
            shelf: "Photography corner",
            detail: "Folded beside the studio backdrop.",
        },
        quantity: 3,
        unit: "pcs",
        description: "A stable stand for filming projects and photographing prototypes.",
        safetyLevel: "normal",
        instructions: [
            "Open the legs fully before mounting a camera or phone.",
            "Tighten each knob gently. Do not force it.",
            "Keep walkways clear so nobody trips over the legs.",
        ],
        imageHint: "studio stand",
    },
];

export const projectIdeas: MakerProjectIdea[] = [
    {
        id: "light-up-story-scene",
        name: "Light-up Story Scene",
        summary: "Build a cardboard scene with a glowing window, sign, or star.",
        difficulty: "Starter",
        requiredItemIds: ["cardboard", "coloured-paper", "leds", "scissors"],
        steps: [
            "Sketch a tiny scene on cardboard.",
            "Cut paper shapes and glue them to the background.",
            "Add one LED behind a window or sign.",
            "Show someone how the light changes the story.",
        ],
    },
    {
        id: "microbit-reaction-game",
        name: "micro:bit Reaction Game",
        summary: "Code a button game that tests who can react fastest.",
        difficulty: "Builder",
        requiredItemIds: ["microbit", "leds"],
        steps: [
            "Connect the micro:bit to a laptop.",
            "Create a countdown animation.",
            "Use button A or B as the player input.",
            "Test with a friend and improve the rules.",
        ],
    },
    {
        id: "prototype-stand",
        name: "Prototype Display Stand",
        summary: "Make a stand to display a model, card, or small invention.",
        difficulty: "Starter",
        requiredItemIds: ["cardboard", "coloured-paper", "scissors"],
        steps: [
            "Fold cardboard into a triangle support.",
            "Cut a slot for the object you want to display.",
            "Decorate the front with coloured paper.",
            "Label what your prototype does.",
        ],
    },
    {
        id: "maker-process-video",
        name: "Maker Process Video",
        summary: "Use the studio tripod to film how your prototype was made.",
        difficulty: "Challenge",
        requiredItemIds: ["camera-tripod", "cardboard"],
        steps: [
            "Place the tripod where it can see the work table.",
            "Record three short clips: idea, making, and final test.",
            "Keep the workspace tidy and safe while filming.",
            "Share the video with a staff member before posting anywhere.",
        ],
    },
];

// Keyword defaults for tools that need adult supervision (requirements doc 5.2).
// "glue gun" is included because the doc's own example is a hot glue gun, and
// the seeded inventory has one named plainly "Glue Gun". Staff can always
// override this per item via the adult-supervision flag in Admin View.
const ADULT_SAFETY_PATTERN = /\b(hot|solder|saw|drill|knife|cutter|glue gun|3d printer|printer|laser|blade|heat gun|iron)\b/;

export function inferMakerSafety(name: string, description = ""): MakerItem["safetyLevel"] {
    return ADULT_SAFETY_PATTERN.test(`${name} ${description}`.toLowerCase()) ? "adult" : "normal";
}

const LOCATION_WORDS = ["where", "find", "located", "location", "shelf", "zone"];
const USE_WORDS = ["use", "how", "instructions", "guide", "work", "safe", "safety"];
const MAKE_WORDS = ["make", "build", "create", "project", "idea", "ideas", "do"];
const INVENTORY_WORDS = ["available", "inventory", "materials", "tools", "equipment", "list"];

// Keep letters and digits from ANY script (\p{L}\p{N}) so non-Latin item names
// survive normalization. The old [a-z0-9:+] class stripped every CJK character,
// collapsing e.g. "纸箱" to "" so it could never be matched — the Maker Bot then
// silently answered only for Latin-named items. Punctuation is still dropped.
function normalize(value: string): string {
    return value.toLowerCase().replace(/[^\p{L}\p{N}:+ ]/gu, " ").replace(/\s+/g, " ").trim();
}

// Words that carry intent or grammar rather than identity. They are ignored
// when scoring partial-name matches so "where is the <thing>" keys off the
// <thing>, and so intent words in an item name never spuriously match.
const MATCH_STOPWORDS = new Set<string>([
    ...LOCATION_WORDS, ...USE_WORDS, ...MAKE_WORDS, ...INVENTORY_WORDS,
    "the", "a", "an", "of", "and", "or", "for", "with", "to", "in", "on",
    "is", "are", "am", "i", "you", "it", "me", "my", "please", "can", "could",
]);

// Meaningful words (>= 3 chars, not a stopword) from a phrase, deduplicated.
function significantTokens(text: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const token of normalize(text).split(" ")) {
        if (token.length < 3 || MATCH_STOPWORDS.has(token) || seen.has(token)) continue;
        seen.add(token);
        out.push(token);
    }
    return out;
}

// A prefix match (either direction, min 3 chars) so plurals and simple
// suffixes line up: "leds" ~ "led", "scissors" ~ "scissor", "printers" ~
// "printer". Kept deliberately conservative to avoid unrelated collisions.
function tokensRelated(a: string, b: string): boolean {
    return a === b || a.startsWith(b) || b.startsWith(a);
}

// Whole-word intent matching. Substring matching mis-routed item names that
// contain an intent word (e.g. "Toki Maker" -> "make", "Dowels" -> "do"),
// sending location questions to the project-ideas branch.
function includesAny(query: string, words: string[]): boolean {
    const tokens = new Set(query.split(" "));
    return words.some(word => tokens.has(word));
}

// Scores how well an item matches the query, in two tiers:
//
//   Tier 1 (full alias in query) — the whole item name/alias appears verbatim.
//     "hot glue gun" (12) beats a decoy aliased "glue gun" (8), so the child
//     reaches the correct — and correctly safety-flagged — item. Any tier-1
//     hit outranks every tier-2 hit via a large offset, preserving specificity.
//
//   Tier 2 (significant word overlap) — no full alias appears, so we fall back
//     to shared meaningful words. Real Firestore items only alias their full
//     name, and children type partial names ("filament", not "3D Printer
//     Filament"); without this tier only certain items ever answered.
const FULL_MATCH_OFFSET = 1_000_000;

function itemMatchScore(item: MakerItem, normalizedQuery: string, queryTokens: string[]): number {
    let best = 0;
    for (const alias of [item.name, ...item.aliases]) {
        const normalizedAlias = normalize(alias);
        if (normalizedAlias && normalizedQuery.includes(normalizedAlias) && normalizedAlias.length > best) {
            best = normalizedAlias.length;
        }
    }
    if (best > 0) return FULL_MATCH_OFFSET + best;

    // Match only against the item's own name — descriptions add noise that
    // would pull unrelated items into range.
    let tokenScore = 0;
    for (const itemToken of significantTokens(item.name)) {
        if (queryTokens.some(q => tokensRelated(q, itemToken))) {
            tokenScore += itemToken.length;
        }
    }
    return tokenScore;
}

function findItem(query: string, items: MakerItem[]): MakerItem | undefined {
    const normalized = normalize(query);
    const queryTokens = significantTokens(query);
    let match: MakerItem | undefined;
    let matchScore = 0;

    for (const item of items) {
        const score = itemMatchScore(item, normalized, queryTokens);
        // Strictly greater keeps the first item on ties (stable, predictable).
        if (score > matchScore) {
            match = item;
            matchScore = score;
        }
    }

    return match;
}

function findMatchingProjects(query: string, projects: MakerProjectIdea[], items: MakerItem[]): MakerProjectIdea[] {
    const normalized = normalize(query);
    const mentionedItemIds = items
        .filter(item => [item.name, ...item.aliases].some(alias => normalized.includes(normalize(alias))))
        .map(item => item.id);

    if (mentionedItemIds.length === 0) {
        return projects.slice(0, 3);
    }

    const scored = projects
        .map(project => ({
            project,
            score: project.requiredItemIds.filter(id => mentionedItemIds.includes(id)).length,
        }))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    return scored.map(entry => entry.project).slice(0, 3);
}

function locationBody(item: MakerItem): string {
    return `${item.name} is in ${item.location.zone}, at ${item.location.shelf}. ${item.location.detail}`;
}

export function answerMakerQuery(
    query: string,
    items: MakerItem[] = makerspaceItems,
    projects: MakerProjectIdea[] = projectIdeas,
): MakerAnswer {
    const normalized = normalize(query);
    const item = findItem(query, items);

    if (!normalized || includesAny(normalized, INVENTORY_WORDS) && !item) {
        return {
            intent: "inventory",
            title: "Here is what I can help you find",
            sections: [
                {
                    kind: "answer",
                    title: "Just ask",
                    body: "Tell me what you are looking for and I will tell you where it is, how to use it safely, and what you can make with it.",
                },
            ],
            projects: [],
            suggestedPrompts: [
                "Where is the hot glue gun?",
                "How do I use a micro:bit?",
                "What can I make with cardboard?",
            ],
        };
    }

    if (item && includesAny(normalized, USE_WORDS)) {
        const sections: MakerAnswerSection[] = [];
        if (item.safetyLevel === "adult") {
            sections.push({
                kind: "safety",
                title: "Ask an adult first",
                body: "This tool needs an adult to help you. Please ask a staff member before using it.",
            });
        }

        sections.push(
            {
                kind: "answer",
                title: `About ${item.name}`,
                body: item.description,
            },
            {
                kind: "steps",
                title: "Steps",
                body: item.instructions.map((step, index) => `${index + 1}. ${step}`).join("\n"),
            },
            {
                kind: "tip",
                title: "Where it lives",
                body: locationBody(item),
            },
        );

        return {
            intent: "use",
            title: `How to use ${item.name}`,
            item,
            sections,
            projects: [],
            suggestedPrompts: [
                `What can I make with ${item.name}?`,
                `Where is ${item.name}?`,
            ],
        };
    }

    // An explicit "where is <known item>" wins over the make branch, even when
    // the item's name contains a make keyword (e.g. "Whyte Labs Project Box").
    const isExplicitLocation = item && includesAny(normalized, LOCATION_WORDS);

    if (includesAny(normalized, MAKE_WORDS) && !isExplicitLocation) {
        const matchedProjects = findMatchingProjects(query, projects, items);
        return {
            intent: "make",
            title: "Project ideas you can try",
            item,
            sections: [
                {
                    kind: "tip",
                    title: "Choose one small idea first",
                    body: "Start with a quick prototype. You can always improve it after your first test.",
                },
            ],
            projects: matchedProjects,
            suggestedPrompts: [
                "Where are the LEDs?",
                "How do I use safety scissors?",
                "What else can I make?",
            ],
        };
    }

    if (item && (includesAny(normalized, LOCATION_WORDS) || !includesAny(normalized, USE_WORDS))) {
        const sections: MakerAnswerSection[] = [
            {
                kind: "answer",
                title: "Location",
                body: locationBody(item),
            },
        ];

        if (item.safetyLevel === "adult") {
            sections.push({
                kind: "safety",
                title: "Safety note",
                body: "This tool needs an adult to help you. Please ask a staff member before using it.",
            });
        }

        return {
            intent: "locate",
            title: `Found: ${item.name}`,
            item,
            sections,
            projects: [],
            suggestedPrompts: [
                `How do I use ${item.name}?`,
                "What can I make?",
            ],
        };
    }

    return {
        intent: "unknown",
        title: "I am not sure yet",
        sections: [
            {
                kind: "answer",
                title: "Ask a staff member",
                body: "I could not find a safe answer for that. Please ask a staff member, or try asking where something is, how to use it, or what you can make.",
            },
        ],
        projects: [],
        suggestedPrompts: [
            "Where is cardboard?",
            "How do I use the hot glue gun?",
            "What can I make with LEDs?",
        ],
    };
}
