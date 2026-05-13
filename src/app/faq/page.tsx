import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";

const faqs = [
  ["Can I reorder a previous scent?", "Yes. Your account keeps past formulas so you can bring a favorite bottle back with a single reorder."],
  ["How do I choose notes?", "Start with a bright top note, build the heart, then choose a base that gives the scent its lasting character."],
  ["Do payments leave the website?", "No. Checkout opens directly inside the North Allen Perfumery site."],
  ["How will I know an order was placed?", "You will receive a confirmation email after checkout, and the studio is notified right away."]
];

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Clear answers before the first spray." body="Practical details for custom orders, checkout, production, and scent care." />
      <Section className="grid gap-4 pt-6">
        {faqs.map(([q, a]) => (
          <details className="glass rounded-[1.25rem] p-6" key={q}>
            <summary className="cursor-pointer font-serif text-2xl font-semibold">{q}</summary>
            <p className="mt-3 text-sm leading-6 text-ink/65">{a}</p>
          </details>
        ))}
      </Section>
    </>
  );
}
