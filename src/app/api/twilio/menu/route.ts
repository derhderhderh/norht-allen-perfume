import { NextRequest } from "next/server";
import { gather, pause, redirect, say, twilioForm, twiml, twimlResponse, validateTwilioRequest } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  const params = await twilioForm(request);
  if (!validateTwilioRequest(request, params)) {
    return twimlResponse(twiml(say("We could not verify this call request.")));
  }

  const digit = params.Digits;

  if (digit === "1") {
    return twimlResponse(twiml([
      gather({
        action: "/api/twilio/order-status",
        numDigits: 6,
        timeout: 10,
        message: "Please enter your six digit order confirmation code now."
      }),
      say("I did not receive the confirmation code."),
      redirect("/api/twilio/voice")
    ].join("")));
  }

  if (digit === "2") {
    return twimlResponse(twiml([
      say("North Allen Perfumery creates custom perfume and cologne online. You choose bottle size, scent strength, and fragrance notes from top, heart, and base categories. The builder shows your scent summary and price before checkout."),
      pause(),
      redirect("/api/twilio/voice")
    ].join("")));
  }

  if (digit === "3") {
    return twimlResponse(twiml([
      say("Custom fragrances are made to order and are final sale. Refunds are only considered for damaged-on-arrival items, and the damaged item must be returned. Once shipped, orders are generally expected within one to two weeks."),
      pause(),
      redirect("/api/twilio/voice")
    ].join("")));
  }

  if (digit === "4") {
    return twimlResponse(twiml([
      gather({
        action: "/api/twilio/knowledge",
        input: "dtmf speech",
        timeout: 8,
        speechTimeout: "auto",
        message: "Ask your question after the tone. You can ask about custom scents, shipping, refunds, pricing, or how the studio works."
      }),
      say("I did not hear a question."),
      redirect("/api/twilio/voice")
    ].join("")));
  }

  return twimlResponse(twiml([
    say("No problem. Let us try again."),
    redirect("/api/twilio/voice")
  ].join("")));
}
