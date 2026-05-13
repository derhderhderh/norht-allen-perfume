import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireUser } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    const decoded = await requireUser(token);
    const snap = await getAdminDb().collection("orders").doc(orderId).get();
    const order = snap.data();
    if (!snap.exists || !order || order.userId !== decoded.uid) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!order.stripeSessionId) {
      return NextResponse.json({ error: "Missing payment session" }, { status: 400 });
    }
    const session = await getStripe().checkout.sessions.retrieve(order.stripeSessionId);
    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed" }, { status: 400 });
  }
}
