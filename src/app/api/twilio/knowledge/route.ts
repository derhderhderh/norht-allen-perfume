import { NextRequest } from "next/server";
import { answerPhoneQuestion } from "@/lib/phone-knowledge";
import { pause, redirect, say, twilioForm, twiml, twimlResponse, validateTwilioRequest } from "@/lib/twilio";

export async function POST(request: NextRequest) {
  const params = await twilioForm(request);
  if (!validateTwilioRequest(request, params)) {
    return twimlResponse(twiml(say("We could not verify this call request.")));
  }

  const question = params.SpeechResult || params.Digits || "";
  return twimlResponse(twiml([
    say(answerPhoneQuestion(question)),
    pause(),
    say("Returning to the main menu."),
    redirect("/api/twilio/voice")
  ].join("")));
}
