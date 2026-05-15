import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    await requireAdmin(token);
    const snap = await getAdminDb().collection("orders").get();
    const batch = getAdminDb().batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return NextResponse.json({ ok: true, deleted: snap.size });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to clear orders" }, { status: 400 });
  }
}
