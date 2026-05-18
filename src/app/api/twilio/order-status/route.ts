import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { PerfumeOrder } from "@/lib/types";
import { pause, redirect, say, twilioForm, twiml, twimlResponse, validateTwilioRequest } from "@/lib/twilio";

function orderStatusPhrase(order: PerfumeOrder) {
  const status = order.orderStatus.replaceAll("_", " ");
  if (order.orderStatus === "pending_payment") return "is waiting for payment to be completed.";
  if (order.orderStatus === "paid") return "has been paid and is waiting for production.";
  if (order.orderStatus === "in_production") return "is currently in production.";
  if (order.orderStatus === "ready_to_ship") return "is ready to ship.";
  if (order.orderStatus === "shipped") return "has shipped and is expected within one to two weeks.";
  if (order.orderStatus === "completed") return "has been completed.";
  if (order.orderStatus === "cancelled") return "has been cancelled.";
  return `is currently marked as ${status}.`;
}

async function findOrder(code: string) {
  const db = getAdminDb();
  const byCode = await db.collection("orders").where("confirmationCode", "==", code).limit(1).get();
  if (!byCode.empty) {
    const doc = byCode.docs[0];
    return { id: doc.id, ...doc.data() } as PerfumeOrder;
  }

  const snap = await db.collection("orders").limit(200).get();
  const doc = snap.docs.find((item) => item.id.slice(-6).replace(/\D/g, "") === code);
  return doc ? ({ id: doc.id, ...doc.data() } as PerfumeOrder) : null;
}

export async function POST(request: NextRequest) {
  const params = await twilioForm(request);
  if (!validateTwilioRequest(request, params)) {
    return twimlResponse(twiml(say("We could not verify this call request.")));
  }

  const code = (params.Digits || "").replace(/\D/g, "");
  const order = code.length === 6 ? await findOrder(code) : null;

  if (!order) {
    return twimlResponse(twiml([
      say("I could not find an order with that confirmation code."),
      pause(),
      say("Please check the six digit code from your confirmation email or dashboard."),
      redirect("/api/twilio/voice")
    ].join("")));
  }

  return twimlResponse(twiml([
    say(`I found your order for ${order.perfumeName}. The order ${orderStatusPhrase(order)}`),
    pause(),
    say("For more help, email contact at north allen perfumery dot org."),
    redirect("/api/twilio/voice")
  ].join("")));
}
