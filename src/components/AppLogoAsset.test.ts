import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function readPngSize(path: string): { width: number; height: number } {
    const buffer = readFileSync(path);
    assert.equal(buffer.toString("ascii", 1, 4), "PNG", `${path} should be a PNG file`);

    return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20),
    };
}

function sha256(path: string): string {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const sourceLogo = "public/GurtXVivita_Logo.png";

assert.equal(
    sha256(sourceLogo),
    "74b3460d2d744b281ef68f6efbb75e33f32925a9d60cb3ee6b83c8d7bf8291d2",
    "public app logo should match the supplied GxV logo image",
);

assert.deepEqual(readPngSize(sourceLogo), { width: 1540, height: 1540 });
assert.deepEqual(readPngSize("public/GurtXVivita_Logo_1024x1024.png"), { width: 1024, height: 1024 });
assert.deepEqual(readPngSize("src-tauri/icons/icon.png"), { width: 512, height: 512 });
assert.deepEqual(readPngSize("src-tauri/icons/32x32.png"), { width: 32, height: 32 });
assert.deepEqual(readPngSize("src-tauri/icons/128x128.png"), { width: 128, height: 128 });
assert.deepEqual(readPngSize("src-tauri/icons/128x128@2x.png"), { width: 256, height: 256 });

console.log("AppLogoAsset.test.ts passed");
