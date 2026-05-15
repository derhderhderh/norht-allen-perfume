import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";

const sections = [
  ["Custom order final sale", "Because each perfume or cologne is custom blended for the customer, all sales are final once production begins. We do not accept refunds, returns, or exchanges for scent preference, note selection, bottle size, strength, delayed customer response, or change of mind."],
  ["Damage-only refund eligibility", "A refund may be considered only when an order arrives damaged. The customer must contact North Allen Perfumery within 48 hours of delivery with the order number, photos of the damaged packaging and bottle, and a description of the issue."],
  ["Return required", "Approved damage claims require the damaged item and packaging to be returned before a refund is issued. The product must be returned in the condition received and with the original packaging whenever possible."],
  ["Review and resolution", "After the returned damaged item is received and inspected, North Allen Perfumery may approve a refund, replacement, or store credit at its discretion. Shipping fees may be non-refundable unless required by law."],
  ["Non-refundable situations", "Orders are not refundable for personal scent preference, allergies not disclosed before purchase, incorrect customer-provided information, unauthorized returns, used product that was not damaged on arrival, or claims submitted after the 48-hour damage window."]
];

export default function RefundPolicyPage() {
  return (
    <>
      <PageHero eyebrow="Refund Policy" title="Strict returns for custom fragrance." body="Custom scents are made to order, so refunds are limited to verified damage on arrival and require return of the damaged item." />
      <Section className="grid gap-4 pt-6">
        {sections.map(([title, body]) => (
          <article key={title} className="glass rounded-[1.25rem] p-6">
            <h2 className="font-serif text-3xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">{body}</p>
          </article>
        ))}
      </Section>
    </>
  );
}
