// The app shortcuts originally required the ⌘ (meta) key, so they did nothing
// on Windows/Linux and in the web build. This helper picks the right primary
// modifier per platform: ⌘ on Apple, Ctrl elsewhere.

export function isApplePlatform(
    platformString: string = typeof navigator !== "undefined" ? navigator.platform : "",
): boolean {
    return /mac|iphone|ipad|ipod/i.test(platformString);
}

type ModifierEvent = {
    metaKey: boolean;
    ctrlKey: boolean;
};

// True when the platform's primary shortcut modifier is held. On Apple that is
// ⌘ (meta); elsewhere it is Ctrl. Requiring the modifier to be *exclusive*
// (the other one not held) keeps Ctrl+⌘ combos — like fullscreen — distinct.
export function hasPrimaryModifier(event: ModifierEvent, isApple: boolean = isApplePlatform()): boolean {
    return isApple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
}

export function shortcutModifierLabel(isApple: boolean = isApplePlatform()): string {
    return isApple ? "⌘" : "Ctrl";
}
