import { NextRequest } from "next/server";
import { gather, pause, redirect, say, twilioForm, twiml, twimlResponse, validateTwilioRequest } from "@/lib/twilio";

function receptionistPrompt() {
  return "Thank you for calling North Allen Perfumery, a North Texas custom fragrance studio. For order status, press 1. For custom perfume information, press 2. For refund and shipping policy, press 3. To ask a question in your own words, press 4. To hear this menu again, press 9.";
}

export async function GET() {
  return twimlResponse(twiml([
    say("North Allen Perfumery phone receptionist is active."),
    say(receptionistPrompt()),
    redirect("/api/twilio/voice")
  ].join("")));
}

export async function POST(request: NextRequest) {
  const params = await twilioForm(request);
  if (!validateTwilioRequest(request, params)) {
    return twimlResponse(twiml([say("We could not verify this call request."), pause(), say("Goodbye.")].join("")));
  }

  return twimlResponse(twiml([
    gather({
      action: "/api/twilio/menu",
      numDigits: 1,
      message: receptionistPrompt()
    }),
    say("I did not receive a selection."),
    redirect("/api/twilio/voice")
  ].join("")));
}
