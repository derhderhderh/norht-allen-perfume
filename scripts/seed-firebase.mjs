import { readFileSync, existsSync } from "node:fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] ||= value;
  }
}

loadEnvFile(".env.local");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in .env.local");
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

const db = getFirestore();
const auth = getAuth();

const options = {
  bottleSizes: [
    { id: "travel", name: "Travel Atomizer", ml: 10, price: 38, active: true },
    { id: "signature", name: "Signature Bottle", ml: 50, price: 118, active: true },
    { id: "collector", name: "Collector Bottle", ml: 100, price: 188, active: true }
  ],
  scentStrengths: [
    { id: "eau-de-toilette", name: "Eau de Toilette", description: "Airy, polished, and close to the skin.", priceModifier: 0, active: true },
    { id: "eau-de-parfum", name: "Eau de Parfum", description: "Balanced projection with a longer trail.", priceModifier: 18, active: true },
    { id: "extrait", name: "Extrait", description: "Rich concentration for the most lasting impression.", priceModifier: 36, active: true }
  ],
  pricingRules: {
    includedNotes: 6,
    extraNotePrice: 8
  }
};

const notes = [
  ["bergamot", "Bergamot", "top", "Bright citrus with a refined tea-like sparkle."],
  ["pink-pepper", "Pink Pepper", "top", "Rosy spice that gives the opening a modern lift."],
  ["mandarin", "Mandarin", "top", "Juicy citrus with soft sweetness and shine."],
  ["neroli", "Neroli", "top", "Clean orange blossom with a crisp green edge."],
  ["lavender", "Lavender", "middle", "Aromatic, polished, and quietly herbal."],
  ["jasmine", "Jasmine", "middle", "Creamy white floral depth with a luminous heart."],
  ["orris", "Orris", "middle", "Powdered elegance with a soft cosmetic finish."],
  ["rose", "Rose", "middle", "Velvety floral texture with a romantic body."],
  ["cedar", "Cedar", "base", "Dry woods with clean structure and warmth."],
  ["amber", "Amber", "base", "Golden resin warmth with a smooth lasting trail."],
  ["vanilla", "Vanilla", "base", "Soft sweetness with a creamy, comforting drydown."],
  ["sandalwood", "Sandalwood", "base", "Milky woods with a calm, polished finish."]
];

await db.collection("products").doc("options").set(options, { merge: true });

await Promise.all(
  notes.map(([id, name, category, description]) =>
    db.collection("notes").doc(id).set(
      {
        name,
        category,
        description,
        imageUrl: "",
        active: true,
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    )
  )
);

const adminEmail = process.env.ADMIN_EMAIL || process.env.PERSONAL_ORDER_EMAIL;
if (adminEmail) {
  try {
    const user = await auth.getUserByEmail(adminEmail);
    await db.collection("users").doc(user.uid).set(
      {
        name: user.displayName || adminEmail.split("@")[0],
        email: adminEmail,
        role: "admin",
        createdAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    console.log(`Seeded catalog and marked ${adminEmail} as admin.`);
  } catch {
    console.log(`Seeded catalog. Create ${adminEmail} in Firebase Auth, then run this again to mark it admin.`);
  }
} else {
  console.log("Seeded catalog. Set ADMIN_EMAIL to mark an admin user.");
}
