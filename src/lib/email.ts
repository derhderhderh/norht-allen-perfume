import { Resend } from "resend";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ContactQuery, OrderStatus, PerfumeOrder } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const from = "North Allen Perfumery <orders@northallenperfumery.org>";
const contactEmail = "contact@northallenperfumery.org";
const ownerEmail = "wilkinsr542@gmail.com";

function emailClient() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

function adminRecipients() {
  return [...new Set([process.env.ADMIN_EMAIL, process.env.PERSONAL_ORDER_EMAIL, ownerEmail].filter(Boolean) as string[])];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function label(value: string) {
  return escapeHtml(value.replaceAll("_", " "));
}

function selectedNotes(order: PerfumeOrder) {
  return (["top", "middle", "base"] as const)
    .map((category) => {
      const names = order.selectedNotes?.[category]?.map((note) => note.name).join(", ") || "None";
      return `
        <tr>
          <td style="padding:10px 0;color:#7a6d5b;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;width:95px;">${category}</td>
          <td style="padding:10px 0;color:#1f1a14;font-size:15px;line-height:22px;">${escapeHtml(names)}</td>
        </tr>
      `;
    })
    .join("");
}

function moneyRows(order: PerfumeOrder) {
  const subtotal = order.subtotal ?? order.price;
  const discount = order.discountAmount ?? 0;
  return `
    <tr>
      <td style="padding:8px 0;color:#7a6d5b;font-size:14px;">Subtotal</td>
      <td style="padding:8px 0;color:#1f1a14;font-size:14px;text-align:right;">${formatMoney(subtotal)}</td>
    </tr>
    ${discount > 0 ? `
      <tr>
        <td style="padding:8px 0;color:#7a6d5b;font-size:14px;">Promo ${order.promoCode ? `(${escapeHtml(order.promoCode)})` : ""}</td>
        <td style="padding:8px 0;color:#1f1a14;font-size:14px;text-align:right;">-${formatMoney(discount)}</td>
      </tr>
    ` : ""}
    <tr>
      <td style="padding:14px 0 0;color:#1f1a14;font-size:16px;font-weight:700;border-top:1px solid #eadfce;">Total paid</td>
      <td style="padding:14px 0 0;color:#1f1a14;font-size:22px;font-weight:700;text-align:right;border-top:1px solid #eadfce;">${formatMoney(order.price)}</td>
    </tr>
  `;
}

function emailShell(preheader: string, title: string, intro: string, body: string) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;background:#f6f1ea;color:#1f1a14;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f1ea;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fffdf8;border:1px solid #eadfce;border-radius:22px;overflow:hidden;box-shadow:0 18px 45px rgba(49,38,25,.10);">
                <tr>
                  <td style="padding:34px 32px 24px;text-align:center;background:#1f1a14;">
                    <div style="font-family:Georgia,serif;font-size:30px;letter-spacing:1px;color:#d7b56d;">North Allen</div>
                    <div style="margin-top:6px;font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#fffdf8;">Perfumery</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:34px 32px 10px;">
                    <p style="margin:0 0 10px;color:#9a7b36;font-size:12px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;">Custom fragrance studio</p>
                    <h1 style="margin:0;font-family:Georgia,serif;font-size:38px;line-height:42px;font-weight:600;color:#1f1a14;">${escapeHtml(title)}</h1>
                    <p style="margin:18px 0 0;color:#63594c;font-size:16px;line-height:26px;">${intro}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 32px 36px;">${body}</td>
                </tr>
                <tr>
                  <td style="padding:22px 32px;text-align:center;background:#f4eadc;color:#7a6d5b;font-size:12px;line-height:18px;">
                    North Allen Perfumery<br />
                    Custom perfume and cologne, blended with boutique care.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function orderDetailsCard(order: PerfumeOrder) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fbf7ef;border:1px solid #eadfce;border-radius:18px;padding:4px 18px;margin-top:20px;">
      <tr>
        <td style="padding:18px 0 6px;">
          <div style="font-family:Georgia,serif;font-size:26px;line-height:30px;color:#1f1a14;">${escapeHtml(order.perfumeName)}</div>
          <div style="margin-top:6px;color:#7a6d5b;font-size:14px;">${escapeHtml(order.bottleSize?.name || "Bottle")} - ${escapeHtml(order.scentStrength?.name || "Strength")}</div>
        </td>
      </tr>
      ${selectedNotes(order)}
    </table>
  `;
}

function totalsCard(order: PerfumeOrder) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffdf8;border:1px solid #eadfce;border-radius:18px;padding:10px 18px;margin-top:16px;">
      ${moneyRows(order)}
    </table>
  `;
}

async function logEmailEvent(data: {
  orderId?: string;
  queryId?: string;
  type:
    | "customer_confirmation"
    | "admin_new_order"
    | "status_update"
    | "contact_customer"
    | "contact_admin"
    | "contact_reply"
    | "contact_follow_up"
    | "contact_follow_up_customer"
    | "contact_form_admin"
    | "contact_inbound_auto_reply"
    | "contact_inbound_admin";
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
  queryId?: string;
  type:
    | "customer_confirmation"
    | "admin_new_order"
    | "status_update"
    | "contact_customer"
    | "contact_admin"
    | "contact_reply"
    | "contact_follow_up"
    | "contact_follow_up_customer"
    | "contact_form_admin"
    | "contact_inbound_auto_reply"
    | "contact_inbound_admin";
  to: string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
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
      html: data.html,
      replyTo: data.replyTo
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
  const title = "Your scent is confirmed";
  await sendTrackedEmail({
    orderId: order.id,
    type: "customer_confirmation",
    to: [order.customerEmail],
    subject: "Your North Allen Perfumery order is confirmed",
    html: emailShell(
      `Order confirmed for ${order.perfumeName}.`,
      title,
      `Hi ${escapeHtml(order.customerName)}, your custom fragrance order has been received and is ready for the studio queue.`,
      `
        ${orderDetailsCard(order)}
        ${totalsCard(order)}
        <p style="margin:20px 0 0;color:#63594c;font-size:15px;line-height:24px;">We will begin production shortly and send updates as your bottle moves through the studio.</p>
      `
    )
  });
}

export async function sendAdminNewOrder(order: PerfumeOrder) {
  const to = adminRecipients();
  const title = "New paid order";
  await sendTrackedEmail({
    orderId: order.id,
    type: "admin_new_order",
    to,
    subject: `New custom order: ${order.perfumeName}`,
    html: emailShell(
      `${order.customerName} placed a paid order.`,
      title,
      `<strong>${escapeHtml(order.customerName)}</strong> placed a paid custom fragrance order. Start this blend when you are ready.`,
      `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#1f1a14;border-radius:18px;padding:18px;margin-top:20px;">
          <tr><td style="color:#d7b56d;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Customer</td></tr>
          <tr><td style="padding-top:8px;color:#fffdf8;font-size:16px;line-height:24px;">${escapeHtml(order.customerName)}<br />${escapeHtml(order.customerEmail)}</td></tr>
          <tr><td style="padding-top:16px;color:#d7b56d;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Status</td></tr>
          <tr><td style="padding-top:8px;color:#fffdf8;font-size:16px;text-transform:capitalize;">${label(order.orderStatus)}</td></tr>
        </table>
        ${orderDetailsCard(order)}
        ${totalsCard(order)}
        ${order.specialInstructions ? `<div style="margin-top:16px;padding:16px;border-radius:16px;background:#f4eadc;color:#4b4238;font-size:14px;line-height:22px;"><strong>Special instructions</strong><br />${escapeHtml(order.specialInstructions)}</div>` : ""}
      `
    )
  });
}

export async function sendStatusUpdate(order: PerfumeOrder, status: OrderStatus) {
  const readableStatus = status.replaceAll("_", " ");
  await sendTrackedEmail({
    orderId: order.id,
    type: "status_update",
    to: [order.customerEmail],
    subject: `Your scent is now ${readableStatus}`,
    html: emailShell(
      `${order.perfumeName} is now ${readableStatus}.`,
      "Order status updated",
      `Hi ${escapeHtml(order.customerName)}, your custom scent <strong>${escapeHtml(order.perfumeName)}</strong> is now <strong style="text-transform:capitalize;">${escapeHtml(readableStatus)}</strong>.`,
      `
        ${orderDetailsCard(order)}
        <div style="margin-top:18px;padding:16px;border-radius:16px;background:#f4eadc;color:#4b4238;font-size:14px;line-height:22px;">Thank you for letting us craft this bottle for you.</div>
      `
    )
  });
}

export async function sendContactQueryCustomer(query: ContactQuery) {
  await sendTrackedEmail({
    queryId: query.id,
    type: "contact_customer",
    to: [query.email],
    subject: "We received your message",
    replyTo: contactEmail,
    html: emailShell(
      "We received your message and will respond shortly.",
      "We received your message",
      `Hi ${escapeHtml(query.name)}, thanks for reaching out to North Allen Perfumery. Your message is in the studio inbox, and an admin will respond shortly.`,
      `
        <div style="margin-top:20px;padding:18px;border-radius:18px;background:#fbf7ef;border:1px solid #eadfce;">
          <p style="margin:0;color:#9a7b36;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Subject</p>
          <p style="margin:8px 0 0;font-family:Georgia,serif;font-size:26px;color:#1f1a14;">${escapeHtml(query.subject)}</p>
          <p style="margin:14px 0 0;color:#63594c;font-size:14px;line-height:22px;">${escapeHtml(query.message).replaceAll("\n", "<br />")}</p>
        </div>
        <p style="margin:20px 0 0;color:#63594c;font-size:15px;line-height:24px;">You can reply directly to this email, or email <strong>${contactEmail}</strong>, and the conversation will stay in the admin dashboard.</p>
      `
    )
  });
}

export async function sendContactQueryAdmin(query: ContactQuery) {
  await sendTrackedEmail({
    queryId: query.id,
    type: query.source === "contact_form" ? "contact_form_admin" : "contact_inbound_admin",
    to: adminRecipients(),
    subject: query.source === "contact_form" ? `New contact form: ${query.subject}` : `New email to North Allen: ${query.subject}`,
    replyTo: query.email,
    html: emailShell(
      `${query.name} sent a message.`,
      query.source === "contact_form" ? "New contact form" : "New customer email",
      query.source === "contact_form"
        ? `<strong>${escapeHtml(query.name)}</strong> filled out the website contact form. Send the response from the admin dashboard.`
        : `<strong>${escapeHtml(query.name)}</strong> emailed ${contactEmail}. Continue the conversation from the admin dashboard.`,
      `
        <div style="margin-top:20px;padding:18px;border-radius:18px;background:#1f1a14;color:#fffdf8;">
          <p style="margin:0;color:#d7b56d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Customer</p>
          <p style="margin:8px 0 0;color:#fffdf8;font-size:15px;line-height:23px;">${escapeHtml(query.name)}<br />${escapeHtml(query.email)}</p>
        </div>
        <div style="margin-top:16px;padding:18px;border-radius:18px;background:#fbf7ef;border:1px solid #eadfce;color:#4b4238;font-size:15px;line-height:24px;">
          <strong>${escapeHtml(query.subject)}</strong><br />${escapeHtml(query.message).replaceAll("\n", "<br />")}
        </div>
      `
    )
  });
}

export async function sendContactReply(query: ContactQuery, subject: string, message: string) {
  await sendTrackedEmail({
    queryId: query.id,
    type: "contact_reply",
    to: [query.email],
    subject,
    replyTo: contactEmail,
    html: emailShell(
      "A reply from North Allen Perfumery.",
      "A note from the studio",
      `Hi ${escapeHtml(query.name)}, the studio sent you a reply.`,
      `
        <div style="margin-top:20px;padding:18px;border-radius:18px;background:#fbf7ef;border:1px solid #eadfce;color:#4b4238;font-size:15px;line-height:24px;">${escapeHtml(message).replaceAll("\n", "<br />")}</div>
        <p style="margin:20px 0 0;color:#63594c;font-size:15px;line-height:24px;">Reply directly to this email and the conversation will stay with the studio.</p>
      `
    )
  });
}

export async function sendContactFollowUpAdmin(query: ContactQuery, subject: string, message: string, fromEmail: string) {
  await sendTrackedEmail({
    queryId: query.id,
    type: "contact_follow_up",
    to: adminRecipients(),
    subject: `Customer replied: ${subject}`,
    replyTo: fromEmail,
    html: emailShell(
      `${query.name} replied to the studio conversation.`,
      "Customer reply received",
      `<strong>${escapeHtml(query.name)}</strong> replied by email. The message has been added to the admin dashboard conversation.`,
      `
        <div style="margin-top:20px;padding:18px;border-radius:18px;background:#1f1a14;color:#fffdf8;">
          <p style="margin:0;color:#d7b56d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Customer</p>
          <p style="margin:8px 0 0;color:#fffdf8;font-size:15px;line-height:23px;">${escapeHtml(query.name)}<br />${escapeHtml(fromEmail)}</p>
        </div>
        <div style="margin-top:16px;padding:18px;border-radius:18px;background:#fbf7ef;border:1px solid #eadfce;color:#4b4238;font-size:15px;line-height:24px;">
          <strong>${escapeHtml(subject)}</strong><br />${escapeHtml(message).replaceAll("\n", "<br />")}
        </div>
      `
    )
  });
}

export async function sendContactFollowUpCustomer(query: ContactQuery) {
  await sendTrackedEmail({
    queryId: query.id,
    type: "contact_follow_up_customer",
    to: [query.email],
    subject: "We received your reply",
    replyTo: contactEmail,
    html: emailShell(
      "We received your reply.",
      "Thanks for the update",
      `Hi ${escapeHtml(query.name)}, thanks for sending that over. Your reply is in the studio inbox, and an admin will respond shortly.`,
      `
        <div style="margin-top:20px;padding:18px;border-radius:18px;background:#fbf7ef;border:1px solid #eadfce;">
          <p style="margin:0;color:#9a7b36;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Status</p>
          <p style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;color:#1f1a14;">Received</p>
          <p style="margin:14px 0 0;color:#63594c;font-size:14px;line-height:22px;">We have your reply in the studio queue.</p>
        </div>
        <p style="margin:20px 0 0;color:#63594c;font-size:15px;line-height:24px;">No extra action is needed right now.</p>
      `
    )
  });
}
