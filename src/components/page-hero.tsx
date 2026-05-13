import { Section } from "@/components/ui";

export function PageHero({ eyebrow, title, body }: { eyebrow?: string; title: string; body: string }) {
  return (
    <Section className="pb-8 pt-16 lg:pt-24">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">{eyebrow}</p> : null}
        <h1 className="mt-4 font-serif text-5xl font-semibold leading-none text-ink sm:text-7xl">{title}</h1>
        <p className="mt-6 text-lg leading-8 text-ink/68">{body}</p>
      </div>
    </Section>
  );
}
