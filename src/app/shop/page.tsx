import { LinkButton, Section } from "@/components/ui";
import { PageHero } from "@/components/page-hero";

export default function ShopPage() {
  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Order a signature custom bottle."
        body="The shop is centered on custom work: choose a size, concentration, and fragrance architecture, then move directly into secure embedded checkout."
      />
      <Section className="grid gap-6 pt-6 md:grid-cols-3">
        {[
          ["Travel Atomizer", "A compact way to test a new formula."],
          ["Signature Bottle", "The house favorite for daily wear."],
          ["Collector Bottle", "For formulas that deserve a longer run."]
        ].map(([title, body]) => (
          <div className="glass rounded-[1.5rem] p-7" key={title}>
            <h2 className="font-serif text-3xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">{body}</p>
            <LinkButton href="/builder" className="mt-6" variant="secondary">
              Customize
            </LinkButton>
          </div>
        ))}
      </Section>
    </>
  );
}
