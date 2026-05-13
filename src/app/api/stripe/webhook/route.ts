import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";
import { sendAdminNewOrder, sendCustomerConfirmation } from "@/lib/email";
import type { PerfumeOrder } from "@/lib/types";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature || "", process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderIds = session.metadata?.orderIds?.split(",").filter(Boolean) || (session.metadata?.orderId ? [session.metadata.orderId] : []);
    for (const orderId of orderIds) {
      const ref = getAdminDb().collection("orders").doc(orderId);
      await ref.update({
        paymentStatus: "paid",
        orderStatus: "paid",
        stripeSessionId: session.id
      });
      const snap = await ref.get();
      const order = { id: snap.id, ...snap.data() } as PerfumeOrder;
      await Promise.all([sendCustomerConfirmation(order), sendAdminNewOrder(order)]);
    }
  }

  return NextResponse.json({ received: true });
}
