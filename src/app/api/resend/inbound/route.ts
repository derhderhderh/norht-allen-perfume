import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendContactFollowUpAdmin, sendContactQueryAdmin, sendContactQueryCustomer } from "@/lib/email";
import type { ContactQuery } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

const companyEmail = "contact@northallenperfumery.org";
const inquiryCodePattern = /NAP-\d{6}-[A-Z0-9]{5}/i;

function queryCode() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NAP-${stamp}-${random}`;
}

function verifySvixSignature(rawBody: string, request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return false;

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  return signature.split(" ").some((part) => {
    const candidate = part.includes(",") ? part.split(",").pop() || "" : part.replace(/^v\d+,/, "");
    const expectedBytes = Buffer.from(expected);
    const candidateBytes = Buffer.from(candidate);
    return expectedBytes.length === candidateBytes.length && timingSafeEqual(expectedBytes, candidateBytes);
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function emailFrom(value: unknown) {
  if (typeof value === "string") return value.match(/<([^>]+)>/)?.[1] || value;
  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    return stringValue(record.email) || stringValue(record.address) || stringValue(record.value);
  }
  return "";
}

function nameFrom(value: unknown, email: string) {
  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    return stringValue(record.name) || email.split("@")[0] || "Customer";
  }
  if (typeof value === "string") {
    const name = value.match(/^"?([^"<]+)"?\s*</)?.[1]?.trim();
    return name || email.split("@")[0] || "Customer";
  }
  return email.split("@")[0] || "Customer";
}

function textFromHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

async function getInboundEmailContent(emailId: string, fallback: UnknownRecord) {
  if (!process.env.RESEND_API_KEY) return fallback;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.get(emailId);
  if (result.error || !result.data) return fallback;
  return { ...fallback, ...result.data } as UnknownRecord;
}

function normalizeInboundEmail(payload: UnknownRecord) {
  const eventData = (payload.data && typeof payload.data === "object" ? payload.data : payload) as UnknownRecord;
  const emailId = stringValue(eventData.email_id) || stringValue(eventData.emailId) || stringValue(eventData.id);
  return { eventData, emailId };
}

async function findQueryByCode(code: string) {
  const snap = await getAdminDb().collection("contactQueries").where("code", "==", code.toUpperCase()).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ref: doc.ref, query: { id: doc.id, ...doc.data() } as ContactQuery };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "resend-inbound",
    accepts: "POST",
    event: "email.received"
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifySvixSignature(rawBody, request)) {
    return NextResponse.json({ error: "Invalid Resend webhook signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as UnknownRecord;
  if (payload.type !== "email.received") return NextResponse.json({ ok: true, ignored: true });

  const { eventData, emailId } = normalizeInboundEmail(payload);
  const email = emailId ? await getInboundEmailContent(emailId, eventData) : eventData;
  const fromEmail = emailFrom(email.from);
  const fromName = nameFrom(email.from, fromEmail);
  const subject = stringValue(email.subject) || "Contact inquiry";
  const text = stringValue(email.text) || textFromHtml(stringValue(email.html)) || "No message content was provided.";
  const code = `${subject}\n${text}`.match(inquiryCodePattern)?.[0]?.toUpperCase();

  if (!fromEmail || fromEmail.toLowerCase().endsWith("@northallenperfumery.org")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const message = {
    id: randomUUID(),
    from: "customer",
    senderName: fromName,
    senderEmail: fromEmail,
    subject,
    body: text,
    createdAt: new Date().toISOString()
  };

  if (code) {
    const existing = await findQueryByCode(code);
    if (existing) {
      await existing.ref.update({
        messages: FieldValue.arrayUnion(message),
        status: "open",
        updatedAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp()
      });
      await sendContactFollowUpAdmin(existing.query, subject, text, fromEmail);
      return NextResponse.json({ ok: true, appended: true, code });
    }
  }

  const newCode = queryCode();
  const ref = await getAdminDb().collection("contactQueries").add({
    name: fromName,
    email: fromEmail,
    subject,
    message: text,
    messages: [message],
    code: newCode,
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    lastMessageAt: FieldValue.serverTimestamp()
  });
  const query = { id: ref.id, name: fromName, email: fromEmail, subject, message: text, messages: [message], code: newCode, status: "open" } as ContactQuery;
  await Promise.all([sendContactQueryCustomer(query), sendContactQueryAdmin(query)]);

  return NextResponse.json({ ok: true, created: true, code: newCode });
}
