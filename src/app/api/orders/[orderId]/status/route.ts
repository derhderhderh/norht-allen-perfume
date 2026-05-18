import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendStatusUpdate } from "@/lib/email";
import { orderStatuses, type PerfumeOrder } from "@/lib/types";
import { callShippedNotification } from "@/lib/twilio";

const schema = z.object({
  status: z.enum(orderStatuses as [string, ...string[]])
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    await requireAdmin(token);
    const { status } = schema.parse(await request.json());
    const ref = getAdminDb().collection("orders").doc(orderId);
    await ref.update({ orderStatus: status });
    const snap = await ref.get();
    const order = { id: snap.id, ...snap.data() } as PerfumeOrder;
    await sendStatusUpdate(order, status as PerfumeOrder["orderStatus"]);
    if (status === "shipped" && order.callOptIn && order.customerPhone && !order.shippedCallAt) {
      try {
        const sid = await callShippedNotification(order);
        await ref.update({
          shippedCallAt: FieldValue.serverTimestamp(),
          shippedCallSid: sid || ""
        });
      } catch (callError) {
        console.error("Shipped phone call failed", callError);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update order" }, { status: 400 });
  }
}
