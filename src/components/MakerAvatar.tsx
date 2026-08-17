import type { MakerAvatarState } from './makerAvatarState';

const EYES: Record<MakerAvatarState, { rx: number; ry: number; cy: number }> = {
    waving: { rx: 3.2, ry: 3.2, cy: 27 },
    cheerful: { rx: 3.2, ry: 2.2, cy: 26 },
    thinking: { rx: 2.6, ry: 3.4, cy: 27 },
    serious: { rx: 3.4, ry: 1.6, cy: 27 },
};

const MOUTHS: Record<MakerAvatarState, string> = {
    waving: 'M24 36 q8 6 16 0',
    cheerful: 'M24 35 q8 8 16 0',
    thinking: 'M26 37 q6 -3 12 0',
    serious: 'M25 37 h14',
};

const ACCENTS: Record<MakerAvatarState, string> = {
    waving: 'var(--vk-accent, #33A7B5)',
    cheerful: 'var(--vk-safe, #2E7D6B)',
    thinking: 'var(--vk-ink-muted, #6F6A61)',
    serious: 'var(--vk-caution, #A1824F)',
};

/**
 * The Maker Bot's face. One SVG whose eyes and mouth swap with the state, so
 * the tone of an answer is visible before it is read — a supervision warning
 * should not look like a cheerful find.
 */
export function MakerAvatar({ state, size = 64 }: { state: MakerAvatarState; size?: number }) {
    const eyes = EYES[state];
    const accent = ACCENTS[state];

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            role="img"
            aria-label={`Maker Bot is ${state}`}
        >
            <rect x="8" y="12" width="48" height="40" rx="14" fill={accent} opacity="0.16" />
            <rect x="8" y="12" width="48" height="40" rx="14" fill="none" stroke={accent} strokeWidth="2.5" />
            <line x1="32" y1="4" x2="32" y2="12" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32" cy="4" r="2.5" fill={accent} />
            <ellipse cx="24" cy={eyes.cy} rx={eyes.rx} ry={eyes.ry} fill={accent} />
            <ellipse cx="40" cy={eyes.cy} rx={eyes.rx} ry={eyes.ry} fill={accent} />
            <path d={MOUTHS[state]} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

export default MakerAvatar;
