"use client";

import { useState } from "react";
import { PageHero } from "@/components/page-hero";
import { Button, Field, Input, Section, Textarea } from "@/components/ui";

export default function ContactPage() {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(form)),
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    setState(res.ok ? "sent" : "error");
    setMessage(res.ok ? "Message sent. We emailed you a confirmation and will respond shortly." : data.error || "Something went wrong. Please try again.");
    if (res.ok) event.currentTarget.reset();
  }

  return (
    <>
      <PageHero eyebrow="Contact" title="Talk fragrance, orders, and custom ideas." body="Send a note to the studio and we will respond with care." />
      <Section className="grid gap-10 pt-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="text-sm leading-7 text-ink/68">
          <p>North Allen, Texas</p>
          <p>contact@northallenperfumery.org</p>
          <p>Custom blending by appointment and online order.</p>
        </div>
        <form onSubmit={submit} className="glass grid gap-4 rounded-[1.5rem] p-6">
          <Field label="Name"><Input name="name" required /></Field>
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Subject"><Input name="subject" required /></Field>
          <Field label="Message"><Textarea name="message" required /></Field>
          <Button loading={state === "loading"}>Send message</Button>
          {state === "sent" ? <p className="text-sm text-moss">{message}</p> : null}
          {state === "error" ? <p className="text-sm text-rosewood">{message}</p> : null}
        </form>
      </Section>
    </>
  );
}
