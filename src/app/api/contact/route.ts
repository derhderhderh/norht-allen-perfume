import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1)
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const apiKey = process.env.RESEND_API_KEY;
    const to = [process.env.ADMIN_EMAIL, process.env.PERSONAL_ORDER_EMAIL || "wilkinsr542@gmail.com"].filter(Boolean) as string[];

    if (!apiKey) {
      return NextResponse.json({ error: "Contact email is not configured yet." }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "North Allen Perfumery <onboarding@resend.dev>",
      to,
      replyTo: body.email,
      subject: `Website inquiry from ${body.name}`,
      html: `<p><strong>${escapeHtml(body.name)}</strong> (${escapeHtml(body.email)}) wrote:</p><p>${escapeHtml(body.message).replaceAll("\n", "<br />")}</p>`
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to send message" }, { status: 400 });
  }
}
