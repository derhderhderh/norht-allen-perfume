import { ArrowRight, Beaker, MapPin, ShieldCheck } from "lucide-react";
import { LinkButton, Section } from "@/components/ui";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595425964071-2c1ec3f13648?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center opacity-20" />
        <div className="relative mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl content-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rosewood">Custom fragrance studio</p>
            <h1 className="mt-5 font-serif text-6xl font-semibold leading-[0.9] text-ink sm:text-8xl">North Allen Perfumery</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/72">
              A local boutique for custom perfume and cologne, blended around the notes you choose and finished with small-batch care.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/builder">Create your scent</LinkButton>
              <LinkButton href="/about" variant="secondary">
                Visit the atelier
              </LinkButton>
            </div>
          </div>
          <div className="glass self-end rounded-[2rem] p-6">
            <div className="aspect-[4/5] rounded-[1.5rem] bg-[url('https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=1000&q=85')] bg-cover bg-center shadow-glass" />
          </div>
        </div>
      </section>
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Curated materials", "Choose from a seasonal palette of bright openings, textured hearts, and lasting bases.", Beaker],
            ["North Allen made", "Boutique formulas, careful blending, and thoughtful order updates.", MapPin],
            ["Private checkout", "Complete your order securely while staying inside the North Allen experience.", ShieldCheck]
          ].map(([title, body, Icon]) => (
            <div className="glass rounded-[1.5rem] p-6" key={title as string}>
              <Icon className="h-6 w-6 text-rosewood" />
              <h2 className="mt-5 font-serif text-2xl font-semibold">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/64">{body as string}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section className="pt-0">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-ink p-8 text-pearl">
            <h2 className="font-serif text-4xl font-semibold">Build from top, heart, and base.</h2>
            <p className="mt-4 text-pearl/72">
              Start with brightness, shape the heart, then anchor the drydown. Your live summary keeps the whole composition in view.
            </p>
            <LinkButton href="/builder" className="mt-7 bg-champagne text-ink hover:bg-pearl">
              Open builder <ArrowRight className="h-4 w-4" />
            </LinkButton>
          </div>
          <div className="grid gap-4 text-sm text-ink/70">
            {["Choose size and strength", "Shape the scent from top to base", "Name the formula", "Complete a secure checkout", "Follow each step from your account"].map((item) => (
              <div key={item} className="flex items-center gap-4 border-b border-ink/10 py-4">
                <span className="h-2 w-2 rounded-full bg-champagne" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
