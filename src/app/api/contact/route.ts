import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendContactQueryAdmin, sendContactQueryCustomer } from "@/lib/email";
import type { ContactQuery } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(1).max(2000)
});

function queryCode() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NAP-${stamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const code = queryCode();
    const message = {
      id: crypto.randomUUID(),
      from: "customer",
      senderName: body.name,
      senderEmail: body.email,
      subject: body.subject,
      body: body.message,
      createdAt: new Date().toISOString()
    };
    const ref = await getAdminDb().collection("contactQueries").add({
      ...body,
      code,
      messages: [message],
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp()
    });

    const query = { id: ref.id, ...body, code, messages: [message], status: "open" } as ContactQuery;
    await Promise.all([sendContactQueryCustomer(query), sendContactQueryAdmin(query)]);

    return NextResponse.json({ ok: true, code });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create inquiry" }, { status: 400 });
  }
}
