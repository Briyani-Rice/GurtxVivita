// Seeds the Firestore `materials` collection from the bundled starter
// inventory, with the imported description dumps parsed into structured
// fields. Idempotent: documents use the starter material ids, so re-running
// overwrites rather than duplicates.
//
// Usage: npx tsx scripts/seedFirestoreMaterials.ts

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { collection, doc, getCountFromServer, getFirestore, writeBatch } from "firebase/firestore";
import { vivitaInventoryMaterials } from "../src/components/vivitaInventoryMaterials.ts";
import { enrichMaterial } from "../src/utils/materialDetails.ts";

const env = Object.fromEntries(
    readFileSync(new URL("../.env.local", import.meta.url), "utf8")
        .split("\n")
        .filter(line => line.includes("="))
        .map(line => [
            line.slice(0, line.indexOf("=")).trim(),
            line.slice(line.indexOf("=") + 1).trim(),
        ]),
);

for (const key of ["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID", "VITE_FIREBASE_APP_ID"]) {
    if (!env[key]) {
        throw new Error(`Missing ${key} in .env.local`);
    }
}

const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const materialsCollection = collection(db, "materials");

const materials = vivitaInventoryMaterials.map(enrichMaterial);
const BATCH_LIMIT = 500;
let written = 0;

for (let start = 0; start < materials.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);

    for (const material of materials.slice(start, start + BATCH_LIMIT)) {
        const { id, ...fields } = material;
        const record = Object.fromEntries(
            Object.entries(fields).filter(([, value]) => value !== undefined),
        );
        batch.set(doc(materialsCollection, id), record);
    }

    await batch.commit();
    written += Math.min(BATCH_LIMIT, materials.length - start);
    console.log(`Seeded ${written}/${materials.length} materials...`);
}

const count = await getCountFromServer(materialsCollection);
console.log(`Done. Firestore materials collection now has ${count.data().count} documents.`);
process.exit(0);
