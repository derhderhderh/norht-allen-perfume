import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/ui";

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Small-batch scent with local-boutique precision."
        body="North Allen Perfumery helps customers turn memory, mood, and material into wearable fragrance without losing the personal touch."
      />
      <Section className="grid gap-8 pt-6 lg:grid-cols-3">
        {[
          ["Personal formulas", "Every order starts with your selected notes and your story, then moves through a careful production workflow."],
          ["Premium ingredients", "The note palette evolves with the season, the studio, and the materials worth wearing."],
          ["Transparent status", "Your account keeps each order clear from confirmation through production, shipping, and completion."]
        ].map(([title, body]) => (
          <article key={title} className="glass rounded-[1.5rem] p-7">
            <h2 className="font-serif text-3xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-ink/65">{body}</p>
          </article>
        ))}
      </Section>
    </>
  );
}
