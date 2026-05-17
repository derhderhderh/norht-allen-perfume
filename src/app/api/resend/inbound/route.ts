import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendContactFollowUpAdmin, sendContactFollowUpCustomer, sendContactQueryAdmin, sendContactQueryCustomer } from "@/lib/email";
import type { ContactQuery } from "@/lib/types";

type UnknownRecord = Record<string, unknown>;

const companyEmail = "contact@northallenperfumery.org";

function logInbound(stage: string, data: UnknownRecord = {}) {
  console.log("[resend-inbound]", JSON.stringify({ stage, ...data }));
}

function queryCode() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NAP-${stamp}-${random}`;
}

function verifySvixSignature(rawBody: string, request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "missing_RESEND_WEBHOOK_SECRET" };

  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) return { ok: false, reason: "missing_svix_headers" };

  try {
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const signedContent = `${id}.${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");
    const ok = signature.split(" ").some((part) => {
      const candidate = part.includes(",") ? part.split(",").pop() || "" : part.replace(/^v\d+,/, "");
      const expectedBytes = Buffer.from(expected);
      const candidateBytes = Buffer.from(candidate);
      return expectedBytes.length === candidateBytes.length && timingSafeEqual(expectedBytes, candidateBytes);
    });

    return ok ? { ok: true } : { ok: false, reason: "signature_mismatch" };
  } catch {
    return { ok: false, reason: "invalid_webhook_secret_format" };
  }
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
  const result = await resend.get<UnknownRecord>(`/emails/receiving/${emailId}`);
  if (result.error || !result.data) {
    logInbound("received_email_fetch_failed", { emailId, error: result.error?.message || "unknown" });
    return fallback;
  }
  return { ...fallback, ...result.data } as UnknownRecord;
}

function normalizeInboundEmail(payload: UnknownRecord) {
  const eventData = (payload.data && typeof payload.data === "object" ? payload.data : payload) as UnknownRecord;
  const emailId = stringValue(eventData.email_id) || stringValue(eventData.emailId) || stringValue(eventData.id);
  return { eventData, emailId };
}

function normalizeSubject(subject: string) {
  return subject.toLowerCase().replace(/^(re|fw|fwd):\s*/i, "").trim();
}

async function findExistingConversation(email: string, subject: string) {
  const snap = await getAdminDb().collection("contactQueries").where("email", "==", email).limit(25).get();
  if (snap.empty) return null;
  const docs = snap.docs
    .map((doc) => ({ ref: doc.ref, query: { id: doc.id, ...doc.data() } as ContactQuery }))
    .sort((a, b) => ((b.query.lastMessageAt || b.query.updatedAt || b.query.createdAt)?.toMillis?.() || 0) - ((a.query.lastMessageAt || a.query.updatedAt || a.query.createdAt)?.toMillis?.() || 0));
  const normalized = normalizeSubject(subject);
  const matchingSubject = docs.find((item) => normalizeSubject(item.query.subject) === normalized);
  const openThread = docs.find((item) => item.query.status === "open");
  return matchingSubject || openThread || docs[0] || null;
}

async function findQueryByLegacyCode(rawText: string) {
  const code = rawText.match(/NAP-\d{6}-[A-Z0-9]{5}/i)?.[0]?.toUpperCase();
  if (!code) return null;
  const snap = await getAdminDb().collection("contactQueries").where("code", "==", code).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { ref: doc.ref, query: { id: doc.id, ...doc.data() } as ContactQuery };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "resend-inbound",
    accepts: "POST",
    event: "email.received",
    configured: {
      resendApiKey: Boolean(process.env.RESEND_API_KEY),
      resendWebhookSecret: Boolean(process.env.RESEND_WEBHOOK_SECRET),
      firebaseAdmin: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const verification = verifySvixSignature(rawBody, request);
    if (!verification.ok) {
      logInbound("signature_failed", {
        reason: verification.reason,
        hasSvixId: Boolean(request.headers.get("svix-id")),
        hasSvixTimestamp: Boolean(request.headers.get("svix-timestamp")),
        hasSvixSignature: Boolean(request.headers.get("svix-signature"))
      });
      return NextResponse.json({ error: "Invalid Resend webhook signature", reason: verification.reason }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as UnknownRecord;
    if (payload.type !== "email.received") {
      logInbound("ignored_event_type", { type: stringValue(payload.type) || "unknown" });
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { eventData, emailId } = normalizeInboundEmail(payload);
    logInbound("received", { emailId: emailId || "missing" });
    const email = emailId ? await getInboundEmailContent(emailId, eventData) : eventData;
    const fromEmail = emailFrom(email.from);
    const fromName = nameFrom(email.from, fromEmail);
    const subject = stringValue(email.subject) || "Contact inquiry";
    const text = stringValue(email.text) || textFromHtml(stringValue(email.html)) || "No message content was provided.";

    if (!fromEmail || fromEmail.toLowerCase().endsWith("@northallenperfumery.org")) {
      logInbound("ignored_sender", { fromEmail: fromEmail || "missing" });
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

    const existing = (await findQueryByLegacyCode(`${subject}\n${text}`)) || (await findExistingConversation(fromEmail, subject));
    if (existing) {
      await existing.ref.update({
        messages: FieldValue.arrayUnion(message),
        status: "open",
        updatedAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp()
      });
      await Promise.all([
        sendContactFollowUpAdmin(existing.query, subject, text, fromEmail),
        sendContactFollowUpCustomer(existing.query)
      ]);
      logInbound("appended_conversation", { queryId: existing.query.id, fromEmail });
      return NextResponse.json({ ok: true, appended: true, id: existing.query.id });
    }

    const newCode = queryCode();
    const ref = await getAdminDb().collection("contactQueries").add({
      name: fromName,
      email: fromEmail,
      subject,
      message: text,
      messages: [message],
      code: newCode,
      source: "inbound_email",
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp()
    });
    const query = { id: ref.id, name: fromName, email: fromEmail, subject, message: text, messages: [message], code: newCode, source: "inbound_email", status: "open" } as ContactQuery;
    await Promise.all([sendContactQueryCustomer(query), sendContactQueryAdmin(query)]);

    logInbound("created_query", { code: newCode, fromEmail });
    return NextResponse.json({ ok: true, created: true, code: newCode });
  } catch (error) {
    logInbound("error", { error: error instanceof Error ? error.message : "Unknown inbound webhook error" });
    return NextResponse.json({ error: "Inbound webhook failed" }, { status: 500 });
  }
}
