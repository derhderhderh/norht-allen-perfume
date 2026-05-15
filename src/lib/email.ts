import { Resend } from "resend";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import type { OrderStatus, PerfumeOrder } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const from = process.env.EMAIL_FROM || "North Allen Perfumery <orders@example.com>";
const ownerEmail = "wilkinsr542@gmail.com";

function emailClient() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

function adminRecipients() {
  return [...new Set([process.env.ADMIN_EMAIL, process.env.PERSONAL_ORDER_EMAIL, ownerEmail].filter(Boolean) as string[])];
}

async function logEmailEvent(data: {
  orderId?: string;
  type: "customer_confirmation" | "admin_new_order" | "status_update";
  to: string[];
  subject: string;
  status: "sent" | "skipped" | "failed";
  resendId?: string;
  error?: string;
}) {
  try {
    await getAdminDb().collection("emailEvents").add({
      ...data,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Email event log failed", error);
  }
}

async function sendTrackedEmail(data: {
  orderId?: string;
  type: "customer_confirmation" | "admin_new_order" | "status_update";
  to: string[];
  subject: string;
  html: string;
}) {
  const resend = emailClient();
  if (!resend || data.to.length === 0) {
    await logEmailEvent({ ...data, status: "skipped", error: "Missing RESEND_API_KEY or recipient" });
    return false;
  }

  try {
    const result = await resend.emails.send({
      from,
      to: data.to,
      subject: data.subject,
      html: data.html
    });

    if (result.error) {
      await logEmailEvent({ ...data, status: "failed", error: result.error.message });
      return false;
    }

    await logEmailEvent({ ...data, status: "sent", resendId: result.data?.id });
    return true;
  } catch (error) {
    await logEmailEvent({ ...data, status: "failed", error: error instanceof Error ? error.message : "Unknown email error" });
    return false;
  }
}

export async function sendCustomerConfirmation(order: PerfumeOrder) {
  await sendTrackedEmail({
    orderId: order.id,
    type: "customer_confirmation",
    to: [order.customerEmail],
    subject: "Your North Allen Perfumery order is confirmed",
    html: `<p>Hi ${order.customerName},</p><p>We received your custom scent order for <strong>${order.perfumeName}</strong>.</p><p>Total: ${formatMoney(order.price)}</p><p>Promo code: ${order.promoCode || "None"}</p><p>We will begin production shortly and send updates as it moves forward.</p>`
  });
}

export async function sendAdminNewOrder(order: PerfumeOrder) {
  const to = adminRecipients();
  await sendTrackedEmail({
    orderId: order.id,
    type: "admin_new_order",
    to,
    subject: `New custom order: ${order.perfumeName}`,
    html: `<p>A new paid order is ready to begin.</p><p><strong>${order.customerName}</strong> (${order.customerEmail}) ordered <strong>${order.perfumeName}</strong>.</p><p>Total paid: ${formatMoney(order.price)}</p><p>Subtotal: ${formatMoney(order.subtotal ?? order.price)}</p><p>Promo code: ${order.promoCode || "None"}</p><p>Status: ${order.orderStatus}</p>`
  });
}

export async function sendStatusUpdate(order: PerfumeOrder, status: OrderStatus) {
  await sendTrackedEmail({
    orderId: order.id,
    type: "status_update",
    to: [order.customerEmail],
    subject: `Your scent is now ${status.replaceAll("_", " ")}`,
    html: `<p>Hi ${order.customerName},</p><p>Your order <strong>${order.perfumeName}</strong> is now <strong>${status.replaceAll("_", " ")}</strong>.</p>`
  });
}
