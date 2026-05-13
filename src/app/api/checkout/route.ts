import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { defaultOptions } from "@/lib/default-options";
import { checkoutBagRequestSchema } from "@/lib/checkout-schema";
import { calculatePrice, selectedNoteCount } from "@/lib/pricing";
import type { FragranceNote, ProductOptions, SelectedNotes } from "@/lib/types";

async function getOptions() {
  const snap = await getAdminDb().collection("products").doc("options").get();
  return snap.exists ? (snap.data() as ProductOptions) : defaultOptions;
}

async function getSelectedNotes(selectedNoteIds: { top: string[]; middle: string[]; base: string[] }) {
  const selectedNotes: SelectedNotes = { top: [], middle: [], base: [] };
  const allIds = [...new Set([...selectedNoteIds.top, ...selectedNoteIds.middle, ...selectedNoteIds.base])];
  if (allIds.length === 0) throw new Error("Choose at least one fragrance note.");

  await Promise.all(
    allIds.map(async (id) => {
      const snap = await getAdminDb().collection("notes").doc(id).get();
      const note = snap.exists ? ({ id: snap.id, ...snap.data() } as FragranceNote) : null;
      if (!note || !note.active) throw new Error("One of the selected notes is no longer available.");
      if (selectedNoteIds[note.category].includes(id)) selectedNotes[note.category].push(note);
    })
  );

  for (const category of ["top", "middle", "base"] as const) {
    if (selectedNotes[category].length !== selectedNoteIds[category].length) {
      throw new Error("A selected note was placed in the wrong category.");
    }
  }

  return selectedNotes;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    const decoded = await requireUser(token);
    const body = checkoutBagRequestSchema.parse(await request.json());
    const db = getAdminDb();
    const [userSnap, productOptions] = await Promise.all([
      db.collection("users").doc(decoded.uid).get(),
      getOptions()
    ]);
    const customerName = userSnap.data()?.name || decoded.name || decoded.email?.split("@")[0] || "Customer";
    const customerEmail = decoded.email;
    if (!customerEmail) throw new Error("Your account needs an email address before checkout.");

    const prepared = await Promise.all(body.items.map(async (item) => {
      const selectedNotes = await getSelectedNotes(item.selectedNoteIds);
      const bottleSize = productOptions.bottleSizes.find((option) => option.id === item.bottleSizeId && option.active);
      const scentStrength = productOptions.scentStrengths.find((option) => option.id === item.scentStrengthId && option.active);
      if (!bottleSize || !scentStrength) throw new Error("A selected bottle or strength is no longer available.");

      const maxNotes = productOptions.pricingRules.maxNotes ?? 12;
      if (selectedNoteCount(selectedNotes) > maxNotes) throw new Error(`Choose up to ${maxNotes} notes for one custom scent.`);

      const price = calculatePrice(bottleSize, scentStrength, selectedNotes, productOptions.pricingRules);
      return { item, selectedNotes, bottleSize, scentStrength, price };
    }));

    const orderRefs = await Promise.all(prepared.map((entry) => db.collection("orders").add({
      userId: decoded.uid,
      customerName,
      customerEmail,
      perfumeName: entry.item.perfumeName,
      selectedNotes: entry.selectedNotes,
      bottleSize: entry.bottleSize,
      scentStrength: entry.scentStrength,
      specialInstructions: entry.item.specialInstructions,
      price: entry.price,
      paymentStatus: "unpaid",
      orderStatus: "pending_payment",
      createdAt: FieldValue.serverTimestamp()
    })));

    const session = await getStripe().checkout.sessions.create({
      ui_mode: "embedded",
      mode: "payment",
      customer_email: customerEmail,
      line_items: prepared.map((entry) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `Custom fragrance: ${entry.item.perfumeName}`,
            description: `${entry.bottleSize.name} - ${entry.scentStrength.name}`
          },
          unit_amount: Math.round(entry.price * 100)
        },
        quantity: 1
      })),
      metadata: {
        orderId: orderRefs[0].id,
        orderIds: orderRefs.map((ref) => ref.id).join(","),
        userId: decoded.uid
      },
      return_url: absoluteUrl(`/checkout/success?session_id={CHECKOUT_SESSION_ID}`)
    });

    await Promise.all(orderRefs.map((ref) => ref.update({ stripeSessionId: session.id })));
    return NextResponse.json({ orderId: orderRefs[0].id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed" }, { status: 400 });
  }
}
