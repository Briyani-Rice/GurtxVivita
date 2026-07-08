import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";

type PngImage = {
    width: number;
    height: number;
    pixels: Buffer;
};

function readUInt32(buffer: Buffer, offset: number): number {
    return buffer.readUInt32BE(offset);
}

function parseRgbaPng(path: URL): PngImage {
    const buffer = readFileSync(path);
    assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", "icon should be a PNG file");

    let offset = 8;
    let width = 0;
    let height = 0;
    const dataChunks: Buffer[] = [];

    while (offset < buffer.length) {
        const length = readUInt32(buffer, offset);
        const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
        const data = buffer.subarray(offset + 8, offset + 8 + length);

        if (type === "IHDR") {
            width = readUInt32(data, 0);
            height = readUInt32(data, 4);
            assert.equal(data[8], 8, "icon should use 8-bit color");
            assert.equal(data[9], 6, "icon should use RGBA color");
            assert.equal(data[10], 0, "icon should use standard deflate compression");
            assert.equal(data[11], 0, "icon should use standard PNG filters");
            assert.equal(data[12], 0, "icon should be non-interlaced");
        }

        if (type === "IDAT") {
            dataChunks.push(data);
        }

        offset += 12 + length;
    }

    const inflated = inflateSync(Buffer.concat(dataChunks));
    const stride = width * 4;
    const pixels = Buffer.alloc(width * height * 4);
    let source = 0;
    let target = 0;
    let previous = Buffer.alloc(stride);
    const bytesPerPixel = 4;

    for (let y = 0; y < height; y += 1) {
        const filter = inflated[source];
        source += 1;
        const row = Buffer.from(inflated.subarray(source, source + stride));
        source += stride;

        for (let i = 0; i < row.length; i += 1) {
            const left = i >= bytesPerPixel ? row[i - bytesPerPixel] : 0;
            const up = previous[i] ?? 0;
            const upLeft = i >= bytesPerPixel ? previous[i - bytesPerPixel] : 0;

            if (filter === 1) {
                row[i] = (row[i] + left) & 0xff;
            } else if (filter === 2) {
                row[i] = (row[i] + up) & 0xff;
            } else if (filter === 3) {
                row[i] = (row[i] + Math.floor((left + up) / 2)) & 0xff;
            } else if (filter === 4) {
                const p = left + up - upLeft;
                const pa = Math.abs(p - left);
                const pb = Math.abs(p - up);
                const pc = Math.abs(p - upLeft);
                const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
                row[i] = (row[i] + predictor) & 0xff;
            } else if (filter !== 0) {
                throw new Error(`Unsupported PNG filter ${filter}`);
            }
        }

        row.copy(pixels, target);
        previous = row;
        target += stride;
    }

    assert.equal(previous.length, stride);

    return { width, height, pixels };
}

function alphaAt(image: PngImage, x: number, y: number): number {
    return image.pixels[(y * image.width + x) * 4 + 3];
}

const icon = parseRgbaPng(new URL("../../src-tauri/icons/icon.png", import.meta.url));
assert.equal(icon.width, 512);
assert.equal(icon.height, 512);

assert.equal(alphaAt(icon, 0, 0), 0, "top-left corner should be transparent for a round app icon");
assert.equal(alphaAt(icon, icon.width - 1, 0), 0, "top-right corner should be transparent for a round app icon");
assert.equal(alphaAt(icon, 0, icon.height - 1), 0, "bottom-left corner should be transparent for a round app icon");
assert.equal(alphaAt(icon, icon.width - 1, icon.height - 1), 0, "bottom-right corner should be transparent for a round app icon");
assert.equal(alphaAt(icon, Math.floor(icon.width / 2), Math.floor(icon.height / 2)), 255);

console.log("AppIconShape.test.ts passed");
