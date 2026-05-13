"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Check, FlaskConical, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, EmptyState, Field, Input, Section, Select, Textarea } from "@/components/ui";
import { getActiveNotes, getProductOptions } from "@/lib/firestore";
import { calculatePrice, selectedNoteCount } from "@/lib/pricing";
import { formatMoney } from "@/lib/utils";
import type { BottleSize, FragranceNote, ProductOptions, SelectedNotes, ScentStrength } from "@/lib/types";

const emptyNotes: SelectedNotes = { top: [], middle: [], base: [] };

export default function BuilderPage() {
  return (
    <Suspense fallback={<Section><div className="glass h-96 animate-pulse rounded-[2rem]" /></Section>}>
      <BuilderClient />
    </Suspense>
  );
}

function BuilderClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [notes, setNotes] = useState<FragranceNote[]>([]);
  const [options, setOptions] = useState<ProductOptions | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<SelectedNotes>(emptyNotes);
  const [bottleSize, setBottleSize] = useState<BottleSize | null>(null);
  const [scentStrength, setScentStrength] = useState<ScentStrength | null>(null);
  const [perfumeName, setPerfumeName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoadError("");
        const [liveNotes, productOptions] = await Promise.all([getActiveNotes(), getProductOptions()]);
        setNotes(liveNotes);
        setOptions(productOptions);
        setBottleSize(productOptions.bottleSizes.find((s) => s.active) || null);
        setScentStrength(productOptions.scentStrengths.find((s) => s.active) || null);
        const reorder = search.get("reorder");
        if (reorder) {
          try {
            const data = JSON.parse(atob(reorder)) as { perfumeName?: string; specialInstructions?: string; selectedNotes?: SelectedNotes };
            const liveById = new Map(liveNotes.map((note) => [note.id, note]));
            setPerfumeName(data.perfumeName ? `${data.perfumeName} Refill` : "");
            setSpecialInstructions(data.specialInstructions || "");
            if (data.selectedNotes) {
              setSelectedNotes({
                top: data.selectedNotes.top.map((note) => liveById.get(note.id)).filter(Boolean) as FragranceNote[],
                middle: data.selectedNotes.middle.map((note) => liveById.get(note.id)).filter(Boolean) as FragranceNote[],
                base: data.selectedNotes.base.map((note) => liveById.get(note.id)).filter(Boolean) as FragranceNote[]
              });
            }
          } catch {
            setError("We could not load that saved formula.");
          }
        }
      } catch {
        setLoadError("The scent builder could not load the current palette. Check your Firebase configuration and try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search]);

  const grouped = useMemo(() => ({
    top: notes.filter((note) => note.category === "top"),
    middle: notes.filter((note) => note.category === "middle"),
    base: notes.filter((note) => note.category === "base")
  }), [notes]);

  const price = options ? calculatePrice(bottleSize, scentStrength, selectedNotes, options.pricingRules) : 0;

  function toggle(note: FragranceNote) {
    setSelectedNotes((current) => {
      const exists = current[note.category].some((item) => item.id === note.id);
      return {
        ...current,
        [note.category]: exists ? current[note.category].filter((item) => item.id !== note.id) : [...current[note.category], note]
      };
    });
  }

  async function checkout() {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!perfumeName.trim() || !bottleSize || !scentStrength || selectedNoteCount(selectedNotes) === 0) {
      setError("Name your scent and choose at least one note.");
      return;
    }
    setSubmitting(true);
    setError("");
    const idToken = await user.getIdToken();
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        perfumeName: perfumeName.trim(),
        selectedNoteIds: {
          top: selectedNotes.top.map((note) => note.id),
          middle: selectedNotes.middle.map((note) => note.id),
          base: selectedNotes.base.map((note) => note.id)
        },
        bottleSizeId: bottleSize.id,
        scentStrengthId: scentStrength.id,
        specialInstructions
      })
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Unable to start checkout.");
      return;
    }
    router.push(`/checkout/${data.orderId}`);
  }

  if (loading) return <Section><div className="glass h-96 animate-pulse rounded-[2rem]" /></Section>;

  if (loadError) {
    return (
      <Section>
        <div className="glass mx-auto max-w-2xl rounded-[2rem] p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rosewood" />
          <h1 className="mt-4 font-serif text-4xl font-semibold">Builder unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-ink/65">{loadError}</p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">Custom perfume builder</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold">Compose your bottle.</h1>
          <div className="mt-8 grid gap-5">
            <div className="glass grid gap-4 rounded-[1.5rem] p-6 md:grid-cols-2">
              <Field label="Bottle size">
                <Select value={bottleSize?.id || ""} onChange={(e) => setBottleSize(options?.bottleSizes.find((s) => s.id === e.target.value) || null)}>
                  {options?.bottleSizes.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} - {item.ml}ml - {formatMoney(item.price)}</option>)}
                </Select>
              </Field>
              <Field label="Scent strength">
                <Select value={scentStrength?.id || ""} onChange={(e) => setScentStrength(options?.scentStrengths.find((s) => s.id === e.target.value) || null)}>
                  {options?.scentStrengths.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} - +{formatMoney(item.priceModifier)}</option>)}
                </Select>
              </Field>
            </div>
            {notes.length === 0 ? <EmptyState title="The scent palette is being refreshed" body="Please check back soon for the latest notes available for custom blending." /> : null}
            {(["top", "middle", "base"] as const).map((category) => (
              <div className="glass rounded-[1.5rem] p-6" key={category}>
                <h2 className="font-serif text-3xl font-semibold capitalize">{category === "middle" ? "Middle / heart" : category} notes</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {grouped[category].map((note) => {
                    const active = selectedNotes[category].some((item) => item.id === note.id);
                    return (
                      <button key={note.id} onClick={() => toggle(note)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-champagne bg-champagne/20" : "border-ink/10 bg-white/55 hover:border-champagne/50"}`}>
                        <span className="flex items-center justify-between gap-3">
                          <strong>{note.name}</strong>
                          {active ? <Check className="h-4 w-4 text-rosewood" /> : null}
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-ink/60">{note.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="glass grid gap-4 rounded-[1.5rem] p-6">
              <Field label="Perfume name"><Input value={perfumeName} onChange={(e) => setPerfumeName(e.target.value)} placeholder="Sunday in Allen" /></Field>
              <Field label="Special instructions"><Textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="Softer vanilla, more citrus sparkle, gift note, allergies..." /></Field>
            </div>
          </div>
        </div>
        <aside className="glass sticky top-28 h-fit rounded-[1.5rem] p-6">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-rosewood" />
            <h2 className="font-serif text-3xl font-semibold">Live summary</h2>
          </div>
          <div className="mt-5 grid gap-4 text-sm">
            <p><strong>Name:</strong> {perfumeName || "Untitled custom scent"}</p>
            <p><strong>Size:</strong> {bottleSize ? `${bottleSize.name}, ${bottleSize.ml}ml` : "Choose a bottle"}</p>
            <p><strong>Strength:</strong> {scentStrength?.name || "Choose strength"}</p>
            {(["top", "middle", "base"] as const).map((category) => (
              <p key={category}><strong className="capitalize">{category}:</strong> {selectedNotes[category].map((n) => n.name).join(", ") || "None selected"}</p>
            ))}
            <div className="border-t border-ink/10 pt-4">
              <p className="font-serif text-4xl font-semibold">{formatMoney(price)}</p>
              <p className="mt-1 text-xs text-ink/55">{selectedNoteCount(selectedNotes)} notes selected</p>
            </div>
            <Button onClick={checkout} loading={submitting} disabled={!bottleSize || !scentStrength || notes.length === 0}>Add to checkout</Button>
            {error ? <p className="text-sm text-rosewood">{error}</p> : null}
          </div>
        </aside>
      </div>
    </Section>
  );
}
