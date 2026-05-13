import { LinkButton, Section } from "@/components/ui";

export default function CheckoutSuccessPage() {
  return (
    <Section className="grid min-h-[70vh] place-items-center text-center">
      <div className="glass max-w-2xl rounded-[2rem] p-9">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">Order received</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">Your custom scent is confirmed.</h1>
        <p className="mt-4 text-ink/65">We sent a confirmation email and notified the studio to begin work.</p>
        <LinkButton href="/dashboard" className="mt-7">View dashboard</LinkButton>
      </div>
    </Section>
  );
}
