import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendStatusUpdate } from "@/lib/email";
import { orderStatuses, type PerfumeOrder } from "@/lib/types";

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
    await sendStatusUpdate({ id: snap.id, ...snap.data() } as PerfumeOrder, status as PerfumeOrder["orderStatus"]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update order" }, { status: 400 });
  }
}
