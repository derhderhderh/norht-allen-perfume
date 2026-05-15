import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb, requireAdmin } from "@/lib/firebase-admin";
import { sendContactQueryAdmin, sendContactQueryCustomer, sendContactReply } from "@/lib/email";
import type { ContactQuery } from "@/lib/types";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(1).max(4000),
  close: z.boolean().optional().default(false)
});

function queryCode() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NAP-${stamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "") || null;
    await requireAdmin(token);
    const body = schema.parse(await request.json());
    const db = getAdminDb();

    if (body.id) {
      const ref = db.collection("contactQueries").doc(body.id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Query not found");
      const query = { id: snap.id, ...snap.data() } as ContactQuery;
      await sendContactReply(query, body.subject, body.message);
      await ref.update({
        status: body.close ? "closed" : "open",
        updatedAt: FieldValue.serverTimestamp()
      });
      return NextResponse.json({ ok: true });
    }

    if (!body.name || !body.email) throw new Error("Name and email are required for a new query.");
    const code = queryCode();
    const ref = await db.collection("contactQueries").add({
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
      code,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    const query = { id: ref.id, name: body.name, email: body.email, subject: body.subject, message: body.message, code, status: "open" } as ContactQuery;
    await Promise.all([sendContactQueryCustomer(query), sendContactQueryAdmin(query)]);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send query email" }, { status: 400 });
  }
}
