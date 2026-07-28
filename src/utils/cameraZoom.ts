// Pure camera-zoom maths for the room map. Kept out of the component so the
// "zoom toward the cursor" behaviour is unit-testable without a canvas.

export type Vec2 = { x: number; y: number };

export function clampZoom(zoom: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, zoom));
}

/**
 * Returns the pan that keeps the world point currently under `anchor` (a point
 * in canvas/screen pixels) fixed on screen after the zoom changes from
 * `fromZoom` to `toZoom`. Without this, zooming always drifts toward the world
 * origin instead of toward what the user is pointing at.
 */
export function panForZoomAtPoint(
    pan: Vec2,
    fromZoom: number,
    toZoom: number,
    anchor: Vec2,
): Vec2 {
    // World point under the anchor before the zoom change.
    const worldX = (anchor.x - pan.x) / fromZoom;
    const worldY = (anchor.y - pan.y) / fromZoom;

    // New pan so that same world point still lands on the anchor.
    return {
        x: anchor.x - worldX * toZoom,
        y: anchor.y - worldY * toZoom,
    };
}
