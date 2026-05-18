import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { PerfumeOrder } from "@/lib/types";

const voice = "Polly.Amy-Neural";
const twilioFrom = process.env.TWILIO_PHONE_NUMBER || "+14699403197";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function twiml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export function say(message: string) {
  return `<Say voice="${voice}" language="en-US"><prosody rate="92%" pitch="-2%">${escapeXml(message)}</prosody></Say>`;
}

export function pause(length = 1) {
  return `<Pause length="${length}" />`;
}

export function redirect(path: string) {
  return `<Redirect method="POST">${escapeXml(path)}</Redirect>`;
}

export function hangup() {
  return "<Hangup />";
}

export function gather(options: { action: string; message: string; numDigits?: number; input?: "dtmf" | "speech" | "dtmf speech"; timeout?: number; speechTimeout?: "auto" | number }) {
  const attrs = [
    `action="${escapeXml(options.action)}"`,
    'method="POST"',
    `input="${options.input || "dtmf"}"`,
    options.numDigits ? `numDigits="${options.numDigits}"` : "",
    `timeout="${options.timeout ?? 6}"`,
    options.speechTimeout ? `speechTimeout="${options.speechTimeout}"` : ""
  ].filter(Boolean).join(" ");

  return `<Gather ${attrs}>${say(options.message)}</Gather>`;
}

export function twimlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8"
    }
  });
}

export async function twilioForm(request: NextRequest) {
  const form = await request.formData();
  return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
}

export function validateTwilioRequest(request: NextRequest, params: Record<string, string>) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token) return true;

  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  const url = process.env.TWILIO_PUBLIC_BASE_URL
    ? `${process.env.TWILIO_PUBLIC_BASE_URL}${request.nextUrl.pathname}`
    : request.url;

  const data = Object.keys(params)
    .sort()
    .reduce((sum, key) => `${sum}${key}${params[key]}`, url);
  const expected = createHmac("sha1", token).update(data).digest("base64");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  return "";
}

function twilioConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && twilioFrom);
}

async function logPhoneEvent(data: Record<string, unknown>) {
  try {
    const { getAdminDb } = await import("@/lib/firebase-admin");
    await getAdminDb().collection("phoneEvents").add({
      ...data,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Phone event log failed", error);
  }
}

export async function callShippedNotification(order: PerfumeOrder) {
  const to = normalizePhone(order.customerPhone || "");
  if (!order.callOptIn || !to || !twilioConfigured()) {
    await logPhoneEvent({
      orderId: order.id,
      type: "shipped_call",
      status: "skipped",
      reason: !order.callOptIn ? "Customer did not opt in" : !to ? "Missing customer phone" : "Missing Twilio env vars"
    });
    return null;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const body = new URLSearchParams({
    To: to,
    From: twilioFrom,
    Twiml: twiml([
      say(`Hello ${order.customerName}. This is North Allen Perfumery calling with an update on your custom fragrance order.`),
      pause(),
      say(`Your order, ${order.perfumeName}, has shipped. It should arrive within the next one to two weeks.`),
      pause(),
      say("Thank you for choosing North Allen Perfumery. We hope the scent feels beautifully personal. Goodbye."),
      hangup()
    ].join(""))
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const result = await response.json().catch(() => ({}));
  await logPhoneEvent({
    orderId: order.id,
    type: "shipped_call",
    status: response.ok ? "sent" : "failed",
    to,
    twilioSid: result.sid,
    error: response.ok ? "" : result.message || "Twilio call failed"
  });

  if (!response.ok) throw new Error(result.message || "Twilio call failed");
  return result.sid as string;
}
