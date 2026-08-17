import type { MakerAnswer } from "./makerspaceData";

export type MakerAvatarState = "waving" | "serious" | "thinking" | "cheerful";

/**
 * Picks the bot's expression from the answer it is already returning.
 *
 * Safety outranks intent deliberately: the adult-supervision warning is the one
 * message that must not look like ordinary chatter, and today it renders as
 * another identical block of text.
 */
export function makerAvatarState(answer: MakerAnswer | null): MakerAvatarState {
    if (!answer) return "waving";

    const hasSafetySection = answer.sections.some(section => section.kind === "safety");
    if (answer.item?.safetyLevel === "adult" || hasSafetySection) {
        return "serious";
    }

    if (answer.intent === "greeting") return "waving";
    if (answer.intent === "unknown") return "thinking";

    return "cheerful";
}
