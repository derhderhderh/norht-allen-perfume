import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";

const sections = [
  ["Information collected", "North Allen Perfumery collects information needed to operate the shop, including name, email address, account details, order details, selected fragrance notes, special instructions, payment status, and customer messages."],
  ["How information is used", "Information is used to provide accounts, process orders, create custom scents, send order and status emails, respond to inquiries, prevent fraud, improve the website, and comply with legal obligations."],
  ["Payments", "Payment details are handled by Stripe. North Allen Perfumery does not store full card numbers. Stripe may collect and process payment data under its own privacy and security practices."],
  ["Email", "North Allen Perfumery uses Resend to send order confirmations, admin notifications, contact replies, and status updates. Email delivery records may be stored to help diagnose whether a message was sent or failed."],
  ["Database and authentication", "Firebase Authentication and Firestore are used for customer accounts, admin access, order records, fragrance notes, pricing options, promo codes, and email event logs."],
  ["Sharing", "Customer information is shared only with service providers needed to operate the business, such as Firebase, Stripe, Resend, hosting providers, and shipping or fulfillment partners when applicable."],
  ["Retention", "Order, account, and email event records may be retained for business, tax, support, security, and legal purposes unless deletion is required by applicable law."],
  ["Choices", "Customers may request account or privacy assistance by contacting North Allen Perfumery. Some records may need to be retained when tied to completed orders or legal obligations."]
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="Privacy policy." body="How North Allen Perfumery collects, uses, and protects information connected to accounts, orders, checkout, and email notifications." />
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
