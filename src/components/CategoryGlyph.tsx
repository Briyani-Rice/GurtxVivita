import {
    Box,
    Camera,
    Cog,
    Cpu,
    Droplet,
    Layers,
    Package,
    Shirt,
    Sparkles,
    Wrench,
} from 'lucide-react';
import { categoryIdentity, type CategoryIconName } from '../utils/categoryIdentity';

const ICONS: Record<CategoryIconName, typeof Wrench> = {
    wrench: Wrench,
    cog: Cog,
    droplet: Droplet,
    cpu: Cpu,
    layers: Layers,
    box: Box,
    shirt: Shirt,
    camera: Camera,
    sparkles: Sparkles,
    package: Package,
};

/**
 * The category badge on a kiosk card. Colour and glyph both come from
 * `categoryIdentity`, so a card is recognisable across a room before any of its
 * text is legible.
 */
export function CategoryGlyph({ category, size = 18 }: { category: string; size?: number }) {
    const { icon, hue } = categoryIdentity(category);
    const Icon = ICONS[icon];

    return (
        <span
            aria-hidden="true"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size + 14,
                height: size + 14,
                borderRadius: 12,
                flexShrink: 0,
                background: `hsl(${hue} 62% 92%)`,
                color: `hsl(${hue} 58% 28%)`,
            }}
        >
            <Icon size={size} strokeWidth={2.25} />
        </span>
    );
}

export default CategoryGlyph;
