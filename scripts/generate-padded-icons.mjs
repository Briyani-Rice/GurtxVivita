import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const sourcePath = join(root, "src-tauri/icons/ios/AppIcon-512@2x.png");
const requestedMasterPath = join(root, "src-tauri/icons/ios/icon-iOS-Default-1024x1024@1x.png");
const iconsetPath = join(root, "src-tauri/icons/icon.iconset");
const artworkScale = 0.82;

const source = PNG.sync.read(readFileSync(sourcePath));

if (source.width !== 1024 || source.height !== 1024) {
    throw new Error(`Expected a 1024x1024 source icon, got ${source.width}x${source.height}`);
}

function sampleBilinear(image, x, y, channel) {
    const x0 = Math.max(0, Math.min(image.width - 1, Math.floor(x)));
    const y0 = Math.max(0, Math.min(image.height - 1, Math.floor(y)));
    const x1 = Math.max(0, Math.min(image.width - 1, x0 + 1));
    const y1 = Math.max(0, Math.min(image.height - 1, y0 + 1));
    const dx = x - x0;
    const dy = y - y0;
    const i00 = (y0 * image.width + x0) * 4 + channel;
    const i10 = (y0 * image.width + x1) * 4 + channel;
    const i01 = (y1 * image.width + x0) * 4 + channel;
    const i11 = (y1 * image.width + x1) * 4 + channel;
    const top = image.data[i00] * (1 - dx) + image.data[i10] * dx;
    const bottom = image.data[i01] * (1 - dx) + image.data[i11] * dx;

    return Math.round(top * (1 - dy) + bottom * dy);
}

function makePadded(size) {
    const out = new PNG({ width: size, height: size, colorType: 6 });
    out.data.fill(0);

    const bodySize = Math.round(size * artworkScale);
    const inset = Math.floor((size - bodySize) / 2);

    for (let y = 0; y < bodySize; y += 1) {
        for (let x = 0; x < bodySize; x += 1) {
            const sourceX = (x + 0.5) * source.width / bodySize - 0.5;
            const sourceY = (y + 0.5) * source.height / bodySize - 0.5;
            const target = ((y + inset) * size + (x + inset)) * 4;

            out.data[target] = sampleBilinear(source, sourceX, sourceY, 0);
            out.data[target + 1] = sampleBilinear(source, sourceX, sourceY, 1);
            out.data[target + 2] = sampleBilinear(source, sourceX, sourceY, 2);
            out.data[target + 3] = sampleBilinear(source, sourceX, sourceY, 3);
        }
    }

    return out;
}

function writePng(path, size) {
    writeFileSync(path, PNG.sync.write(makePadded(size)));
}

const iosIcons = new Map([
    ["AppIcon-20x20@1x.png", 20],
    ["AppIcon-20x20@2x-1.png", 40],
    ["AppIcon-20x20@2x.png", 40],
    ["AppIcon-20x20@3x.png", 60],
    ["AppIcon-29x29@1x.png", 29],
    ["AppIcon-29x29@2x-1.png", 58],
    ["AppIcon-29x29@2x.png", 58],
    ["AppIcon-29x29@3x.png", 87],
    ["AppIcon-40x40@1x.png", 40],
    ["AppIcon-40x40@2x-1.png", 80],
    ["AppIcon-40x40@2x.png", 80],
    ["AppIcon-40x40@3x.png", 120],
    ["AppIcon-512@2x.png", 1024],
    ["AppIcon-60x60@2x.png", 120],
    ["AppIcon-60x60@3x.png", 180],
    ["AppIcon-76x76@1x.png", 76],
    ["AppIcon-76x76@2x.png", 152],
    ["AppIcon-83.5x83.5@2x.png", 167],
]);

const macPngIcons = new Map([
    ["32x32.png", 32],
    ["64x64.png", 64],
    ["128x128.png", 128],
    ["128x128@2x.png", 256],
    ["icon.png", 512],
]);

const macIconsetIcons = new Map([
    ["icon_16x16.png", 16],
    ["icon_16x16@2x.png", 32],
    ["icon_32x32.png", 32],
    ["icon_32x32@2x.png", 64],
    ["icon_128x128.png", 128],
    ["icon_128x128@2x.png", 256],
    ["icon_256x256.png", 256],
    ["icon_256x256@2x.png", 512],
    ["icon_512x512.png", 512],
    ["icon_512x512@2x.png", 1024],
]);

writePng(requestedMasterPath, 1024);

for (const [name, size] of iosIcons) {
    writePng(join(root, "src-tauri/icons/ios", name), size);
}

for (const [name, size] of macPngIcons) {
    writePng(join(root, "src-tauri/icons", name), size);
}

rmSync(iconsetPath, { recursive: true, force: true });
mkdirSync(iconsetPath, { recursive: true });

for (const [name, size] of macIconsetIcons) {
    writePng(join(iconsetPath, name), size);
}

const iconutil = spawnSync(
    "iconutil",
    ["-c", "icns", iconsetPath, "-o", join(root, "src-tauri/icons/icon.icns")],
    { stdio: "inherit" },
);

rmSync(iconsetPath, { recursive: true, force: true });

if (iconutil.status !== 0) {
    throw new Error("iconutil failed to generate src-tauri/icons/icon.icns");
}

console.log("Generated padded iOS and macOS icons");
