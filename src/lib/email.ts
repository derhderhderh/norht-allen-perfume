import { Resend } from "resend";
import type { OrderStatus, PerfumeOrder } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const from = process.env.EMAIL_FROM || "North Allen Perfumery <orders@example.com>";

function emailClient() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

function adminRecipients() {
  return [process.env.ADMIN_EMAIL, process.env.PERSONAL_ORDER_EMAIL].filter(Boolean) as string[];
}

export async function sendCustomerConfirmation(order: PerfumeOrder) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = emailClient();
  if (!resend) return;
  await resend.emails.send({
    from,
    to: order.customerEmail,
    subject: `Your North Allen Perfumery order is confirmed`,
    html: `<p>Hi ${order.customerName},</p><p>We received your custom scent order for <strong>${order.perfumeName}</strong>.</p><p>Total: ${formatMoney(order.price)}</p><p>We will begin production shortly and send updates as it moves forward.</p>`
  });
}

export async function sendAdminNewOrder(order: PerfumeOrder) {
  const to = adminRecipients();
  const resend = emailClient();
  if (!resend || to.length === 0) return;
  await resend.emails.send({
    from,
    to,
    subject: `New custom order: ${order.perfumeName}`,
    html: `<p>A new paid order is ready to begin.</p><p><strong>${order.customerName}</strong> (${order.customerEmail}) ordered <strong>${order.perfumeName}</strong>.</p><p>Total: ${formatMoney(order.price)}</p><p>Status: ${order.orderStatus}</p>`
  });
}

export async function sendStatusUpdate(order: PerfumeOrder, status: OrderStatus) {
  if (!process.env.RESEND_API_KEY) return;
  const resend = emailClient();
  if (!resend) return;
  await resend.emails.send({
    from,
    to: order.customerEmail,
    subject: `Your scent is now ${status.replaceAll("_", " ")}`,
    html: `<p>Hi ${order.customerName},</p><p>Your order <strong>${order.perfumeName}</strong> is now <strong>${status.replaceAll("_", " ")}</strong>.</p>`
  });
}
