import type { FloorData } from "../types";

/** How many `--vk-zone-*` tokens exist. Areas beyond this wrap. */
const ZONE_TOKEN_COUNT = 7;

/**
 * The colour token for the area a material lives in.
 *
 * Materials link to an area by `compartmentId`, which matches a `FloorElement`
 * id — the same relationship `getAreaInventory` uses. Position in the floor plan
 * decides the colour, so an area is the same colour on a card as on the map, and
 * stays that colour across renders.
 *
 * Only `compartment` elements count. Floors also hold chairs, tables and stairs;
 * counting those would let moving a chair repaint every zone.
 */
export function zoneToken(
    compartmentId: string | undefined,
    floors: FloorData[]
): string | null {
    if (!compartmentId) return null;

    let position = 0;

    for (const floor of floors) {
        for (const element of floor.elements) {
            if (element.type !== "compartment") continue;

            if (element.id === compartmentId) {
                return `var(--vk-zone-${(position % ZONE_TOKEN_COUNT) + 1})`;
            }

            position += 1;
        }
    }

    return null;
}
