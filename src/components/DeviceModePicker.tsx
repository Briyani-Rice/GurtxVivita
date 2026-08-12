import { Monitor, Tablet, Tv } from 'lucide-react';
import { storeDisplayMode, type DisplayMode } from '../utils/displayMode';
import { useI18n, type TranslationKey } from '../i18n/i18n';

/**
 * Asks a native device what it is.
 *
 * The hosted web build answers this with `?display=`, but an installed
 * iOS/Android/TV app has no URL, so without this a kiosk tablet and a TV would
 * both boot into the full desktop shell. Shown once on first launch; the answer
 * is persisted and the device never asks again.
 *
 * Buttons are in DOM order and large, so a TV remote's D-pad can pick one.
 */

const MODE_ORDER: DisplayMode[] = ['kiosk', 'tv', 'normal'];

const MODE_ICONS: Record<DisplayMode, typeof Monitor> = {
    kiosk: Tablet,
    tv: Tv,
    normal: Monitor,
};

const MODE_TITLE_KEYS: Record<DisplayMode, TranslationKey> = {
    kiosk: 'device.kioskTitle',
    tv: 'device.tvTitle',
    normal: 'device.normalTitle',
};

const MODE_BODY_KEYS: Record<DisplayMode, TranslationKey> = {
    kiosk: 'device.kioskBody',
    tv: 'device.tvBody',
    normal: 'device.normalBody',
};

const styles = {
    backdrop: {
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: 'max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom)) 24px',
        background: 'var(--viventory-bg)',
        color: 'var(--viventory-text)',
        overflowY: 'auto',
    } as React.CSSProperties,

    heading: {
        margin: 0,
        fontSize: 30,
        fontWeight: 850,
        textAlign: 'center',
    } as React.CSSProperties,

    subheading: {
        margin: 0,
        fontSize: 16,
        color: 'var(--viventory-muted-text)',
        textAlign: 'center',
        maxWidth: 460,
    } as React.CSSProperties,

    options: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        width: '100%',
        maxWidth: 760,
    } as React.CSSProperties,

    option: {
        flex: '1 1 200px',
        minWidth: 180,
        minHeight: 150,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 20,
        borderRadius: 22,
        border: '2px solid var(--viventory-border)',
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        cursor: 'pointer',
        textAlign: 'center',
    } as React.CSSProperties,

    optionTitle: { fontSize: 18, fontWeight: 850 } as React.CSSProperties,

    optionBody: {
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--viventory-muted-text)',
        lineHeight: 1.35,
    } as React.CSSProperties,

    footnote: {
        margin: 0,
        fontSize: 13,
        color: 'var(--viventory-muted-text)',
        textAlign: 'center',
        maxWidth: 460,
    } as React.CSSProperties,
};

export function DeviceModePicker({ onChoose }: { onChoose: (mode: DisplayMode) => void }) {
    const { t } = useI18n();

    const choose = (mode: DisplayMode) => {
        storeDisplayMode(mode);
        onChoose(mode);
    };

    return (
        <div style={styles.backdrop} role="dialog" aria-modal="true" aria-label={t('device.title')}>
            <h1 style={styles.heading}>{t('device.title')}</h1>
            <p style={styles.subheading}>{t('device.subtitle')}</p>

            <div style={styles.options}>
                {MODE_ORDER.map(mode => {
                    const Icon = MODE_ICONS[mode];

                    return (
                        <button
                            key={mode}
                            type="button"
                            style={styles.option}
                            onClick={() => choose(mode)}
                        >
                            <Icon size={34} />
                            <span style={styles.optionTitle}>{t(MODE_TITLE_KEYS[mode])}</span>
                            <span style={styles.optionBody}>{t(MODE_BODY_KEYS[mode])}</span>
                        </button>
                    );
                })}
            </div>

            <p style={styles.footnote}>{t('device.changeLater')}</p>
        </div>
    );
}

export default DeviceModePicker;
