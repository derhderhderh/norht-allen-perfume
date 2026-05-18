import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";

const sections = [
  ["Custom products", "North Allen Perfumery sells custom perfume and cologne products based on customer-selected bottle size, scent strength, fragrance notes, name, and instructions. Final scent character may vary because fragrance is subjective and materials can evolve over time."],
  ["Accounts", "Customers are responsible for maintaining accurate account information and safeguarding login credentials. Orders and account activity made through a customer account are treated as authorized by that customer."],
  ["Orders and payment", "Orders must be paid in full before production unless a valid approved promo code applies. North Allen Perfumery may cancel or refuse orders caused by pricing errors, suspected fraud, unavailable materials, or misuse of promo codes."],
  ["Production and shipping", "Production timelines are estimates and may vary by order volume, material availability, and shipping carrier performance. Customers are responsible for providing accurate shipping and contact information."],
  ["Phone notifications", "Customers may opt in to automated transactional calls about order status. North Allen Perfumery does not use the website checkout phone field for unsolicited robocalls. Customers can choose not to provide a phone number or not to opt in."],
  ["Refunds", "Refunds are governed by the Refund Policy. Custom fragrance orders are final sale except for approved damaged-on-arrival claims that meet the policy requirements."],
  ["Acceptable use", "Customers may not misuse the website, attempt unauthorized access, interfere with checkout, scrape private data, or submit unlawful, abusive, or misleading information."],
  ["Limitation of liability", "To the fullest extent permitted by law, North Allen Perfumery is not liable for indirect, incidental, special, or consequential damages related to use of the website or custom fragrance products."],
  ["Changes", "North Allen Perfumery may update these terms from time to time. Continued use of the website or purchase of products means the updated terms apply."]
];

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Terms" title="Terms of service." body="The terms that apply when using the website, creating an account, building a custom scent, or placing an order." />
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
