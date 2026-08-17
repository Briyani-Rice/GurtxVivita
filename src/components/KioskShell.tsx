import { useRef, useState } from 'react';
import { Search, MessageCircle, Map } from 'lucide-react';
import { UserView } from './UserView';
import { MakerKiosk } from './MakerKiosk';
import { useInventory } from './InventoryProvider';
import { useI18n, type TranslationKey } from '../i18n/i18n';

/**
 * The child-facing shell.
 *
 * Replaces the desktop tab strip and command bar with three fixed destinations
 * that are always on screen, so a child never has to manage tabs or discover a
 * hidden menu to get back. The same three targets are focusable with a TV
 * remote's D-pad, which is why they are ordinary buttons in DOM order rather
 * than a pointer-driven control.
 */

export type KioskDestination = 'find' | 'ask' | 'map';

export const KIOSK_DESTINATIONS: KioskDestination[] = ['find', 'ask', 'map'];

const DESTINATION_LABEL_KEYS: Record<KioskDestination, TranslationKey> = {
    find: 'kiosk.navFind',
    ask: 'kiosk.navAsk',
    map: 'kiosk.navMap',
};

const DESTINATION_ICONS: Record<KioskDestination, typeof Search> = {
    find: Search,
    ask: MessageCircle,
    map: Map,
};

const styles = {
    shell: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--vk-ground, var(--viventory-bg))',
        color: 'var(--vk-ink, var(--viventory-text))',
        // TV panels crop the frame edges; keep content inside the safe area.
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left)',
    } as React.CSSProperties,

    pane: {
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    } as React.CSSProperties,

    navBar: {
        display: 'flex',
        alignItems: 'stretch',
        gap: 8,
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom)) 12px',
        borderTop: '2px solid var(--viventory-border)',
        background: 'var(--viventory-panel, var(--viventory-bg))',
    } as React.CSSProperties,

    // Staff escape hatch. Deliberately unlabelled and in the corner: a locked
    // kiosk still has to be recoverable, but a child tapping around must not
    // fall out of the app. Long-press is the gate, not obscurity alone.
    escapeHatch: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 56,
        height: 56,
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'default',
        opacity: 0,
    } as React.CSSProperties,

    navBtn: (active: boolean): React.CSSProperties => ({
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        // Large enough for a child's touch and visible from across a room.
        minHeight: 72,
        padding: '10px 8px',
        borderRadius: 18,
        border: 'none',
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 850,
        background: active ? 'var(--viventory-welcome-accent)' : 'transparent',
        color: active ? '#1f1300' : 'var(--viventory-muted-text)',
    }),
};

/** How long staff must hold the corner before the device-mode picker opens. */
export const ESCAPE_HATCH_HOLD_MS = 2000;

export function KioskShell({ onRequestModeChange }: { onRequestModeChange?: () => void } = {}) {
    const [destination, setDestination] = useState<KioskDestination>('find');
    const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inventory = useInventory();
    const { t } = useI18n();

    const startHold = () => {
        if (!onRequestModeChange || holdTimer.current) return;
        holdTimer.current = setTimeout(() => {
            holdTimer.current = null;
            onRequestModeChange();
        }, ESCAPE_HATCH_HOLD_MS);
    };

    const cancelHold = () => {
        if (holdTimer.current) {
            clearTimeout(holdTimer.current);
            holdTimer.current = null;
        }
    };

    return (
        <div className="viventory-kiosk" style={styles.shell}>
            {onRequestModeChange && (
                <button
                    type="button"
                    style={styles.escapeHatch}
                    aria-label={t('device.changeMode')}
                    onPointerDown={startHold}
                    onPointerUp={cancelHold}
                    onPointerLeave={cancelHold}
                    onPointerCancel={cancelHold}
                />
            )}
            <div style={styles.pane}>
                {destination === 'ask' ? (
                    <MakerKiosk />
                ) : (
                    <UserView
                        floors={inventory.floors}
                        materials={inventory.materials}
                        requests={inventory.requests}
                        onSubmitRequest={inventory.submitRequest}
                        initialTab={destination === 'map' ? 'map' : 'materials'}
                        showTabBar={false}
                        prefs={{
                            hideOutOfStock: false,
                            compactCards: false,
                            defaultFloor: 0,
                        }}
                    />
                )}
            </div>

            <nav style={styles.navBar} aria-label={t('kiosk.navLabel')}>
                {KIOSK_DESTINATIONS.map(target => {
                    const Icon = DESTINATION_ICONS[target];
                    const active = destination === target;

                    return (
                        <button
                            key={target}
                            type="button"
                            style={styles.navBtn(active)}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => setDestination(target)}
                        >
                            <Icon size={28} />
                            {t(DESTINATION_LABEL_KEYS[target])}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}

export default KioskShell;
