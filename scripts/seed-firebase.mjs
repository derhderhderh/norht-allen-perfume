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
    { id: "travel", name: "Travel Atomizer", ml: 10, price: 28, active: true },
    { id: "signature", name: "Signature Bottle", ml: 50, price: 88, active: true },
    { id: "collector", name: "Collector Bottle", ml: 100, price: 148, active: true }
  ],
  scentStrengths: [
    { id: "eau-de-toilette", name: "Eau de Toilette", description: "Airy, polished, and close to the skin.", priceModifier: 0, active: true },
    { id: "eau-de-parfum", name: "Eau de Parfum", description: "Balanced projection with a longer trail.", priceModifier: 12, active: true },
    { id: "extrait", name: "Extrait", description: "Rich concentration for the most lasting impression.", priceModifier: 24, active: true }
  ],
  pricingRules: {
    includedNotes: 6,
    extraNotePrice: 5,
    maxNotes: 12
  }
};

const notes = [
  ["bergamot", "Bergamot", "top", "Bright citrus with a refined tea-like sparkle."],
  ["grapefruit", "Grapefruit", "top", "Bitter citrus snap with a clean sparkling edge."],
  ["blood-orange", "Blood Orange", "top", "Juicy citrus with a warm ruby brightness."],
  ["lemon-zest", "Lemon Zest", "top", "Crisp, sunny citrus with a lively first impression."],
  ["pink-pepper", "Pink Pepper", "top", "Rosy spice that gives the opening a modern lift."],
  ["black-pepper", "Black Pepper", "top", "Dry spice with a tailored, energetic bite."],
  ["mandarin", "Mandarin", "top", "Juicy citrus with soft sweetness and shine."],
  ["neroli", "Neroli", "top", "Clean orange blossom with a crisp green edge."],
  ["pear", "Pear", "top", "Fresh orchard sweetness with a watery sheen."],
  ["green-tea", "Green Tea", "top", "Soft tea leaf freshness with a calming clarity."],
  ["mint-leaf", "Mint Leaf", "top", "Cool herbal lift with a crisp finish."],
  ["lavender", "Lavender", "middle", "Aromatic, polished, and quietly herbal."],
  ["jasmine", "Jasmine", "middle", "Creamy white floral depth with a luminous heart."],
  ["tuberose", "Tuberose", "middle", "Velvety white floral richness with a confident bloom."],
  ["orange-blossom", "Orange Blossom", "middle", "Soft floral brightness with a honeyed glow."],
  ["orris", "Orris", "middle", "Powdered elegance with a soft cosmetic finish."],
  ["rose", "Rose", "middle", "Velvety floral texture with a romantic body."],
  ["violet", "Violet", "middle", "Delicate floral powder with a cool petal texture."],
  ["sage", "Clary Sage", "middle", "Herbal warmth with a smooth aromatic character."],
  ["cardamom", "Cardamom", "middle", "Green spice with a creamy, quietly luxurious feel."],
  ["fig-leaf", "Fig Leaf", "middle", "Green, milky leafiness with a modern boutique feel."],
  ["cashmere", "Cashmere Accord", "middle", "Soft musky warmth with a brushed-fabric texture."],
  ["cedar", "Cedar", "base", "Dry woods with clean structure and warmth."],
  ["vetiver", "Vetiver", "base", "Earthy grass and dry woods with elegant restraint."],
  ["patchouli", "Patchouli", "base", "Deep, earthy warmth with a smooth polished edge."],
  ["amber", "Amber", "base", "Golden resin warmth with a smooth lasting trail."],
  ["vanilla", "Vanilla", "base", "Soft sweetness with a creamy, comforting drydown."],
  ["tonka", "Tonka Bean", "base", "Warm almond sweetness with a rounded finish."],
  ["musk", "Clean Musk", "base", "Soft skin-like comfort with a sheer lasting trail."],
  ["oud", "Oud", "base", "Dark resinous wood with a dramatic, smoky depth."],
  ["leather", "Leather", "base", "Supple warmth with a refined, tailored finish."],
  ["sandalwood", "Sandalwood", "base", "Milky woods with a calm, polished finish."]
];

await db.collection("products").doc("options").set(options, { merge: true });
await db.collection("promoCodes").doc("northallen100").set(
  {
    code: "NORTHALLEN100",
    description: "100% off order",
    active: true,
    percentOff: 100,
    createdAt: FieldValue.serverTimestamp()
  },
  { merge: true }
);

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
    console.log(`Seeded catalog, promo codes, and marked ${adminEmail} as admin.`);
  } catch {
    console.log(`Seeded catalog and promo codes. Create ${adminEmail} in Firebase Auth, then run this again to mark it admin.`);
  }
} else {
  console.log("Seeded catalog. Set ADMIN_EMAIL to mark an admin user.");
}
