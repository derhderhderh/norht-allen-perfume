"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useBag } from "@/components/bag-provider";
import { Button, EmptyState, LinkButton, Section } from "@/components/ui";
import { formatMoney } from "@/lib/utils";

export default function BagPage() {
  const { user, loading } = useAuth();
  const { items, removeItem, clearBag } = useBag();
  const [error, setError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [callOptIn, setCallOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const total = items.reduce((sum, item) => sum + item.estimatedPrice, 0);

  async function checkout() {
    if (!user) {
      router.push("/login?next=/bag");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          items: items.map((item) => ({
            perfumeName: item.perfumeName,
            selectedNoteIds: item.selectedNoteIds,
            bottleSizeId: item.bottleSizeId,
            scentStrengthId: item.scentStrengthId,
            specialInstructions: item.specialInstructions
          })),
          promoCode,
          customerPhone,
          callOptIn
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to start checkout.");
      if (data.successUrl) {
        clearBag();
        router.push(data.successUrl);
      } else {
        router.push(`/checkout/${data.orderId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Section><div className="glass h-80 animate-pulse rounded-[2rem]" /></Section>;

  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">Shopping bag</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">Your custom scents</h1>
        </div>
        <LinkButton href="/builder" variant="secondary">Add another scent</LinkButton>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          {items.length === 0 ? <EmptyState title="Your bag is empty" body="Build a custom scent and add it here before checkout." /> : null}
          {items.map((item) => (
            <article key={item.id} className="glass rounded-[1.5rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl font-semibold">{item.perfumeName}</h2>
                  <p className="mt-1 text-sm text-ink/60">{item.bottleSizeName} - {item.scentStrengthName}</p>
                </div>
                <Button variant="ghost" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-ink/68 md:grid-cols-3">
                {(["top", "middle", "base"] as const).map((category) => (
                  <p key={category}><strong className="capitalize">{category}:</strong> {item.noteNames[category].join(", ") || "None"}</p>
                ))}
              </div>
              <p className="mt-4 font-serif text-2xl font-semibold">{formatMoney(item.estimatedPrice)}</p>
            </article>
          ))}
        </div>
        <aside className="glass h-fit rounded-[1.5rem] p-6">
          <h2 className="font-serif text-3xl font-semibold">Summary</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <p>{items.length} custom scent{items.length === 1 ? "" : "s"}</p>
            <label className="grid gap-2 text-sm font-medium text-ink/75">
              Promo code
              <input className="focus-ring w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm uppercase shadow-sm" value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} placeholder="Enter code" />
            </label>
            {promoCode ? <p className="text-xs text-ink/55">100% off codes are checked when you checkout.</p> : null}
            <label className="grid gap-2 text-sm font-medium text-ink/75">
              Phone for status calls
              <input className="focus-ring w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm shadow-sm" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="(469) 555-0199" />
            </label>
            <label className="flex items-start gap-2 text-xs leading-5 text-ink/60">
              <input className="mt-1" type="checkbox" checked={callOptIn} onChange={(event) => setCallOptIn(event.target.checked)} />
              I agree to receive automated order status calls from North Allen Perfumery at this number. Message and data rates may apply.
            </label>
            <p className="border-t border-ink/10 pt-4 font-serif text-4xl font-semibold">{formatMoney(total)}</p>
            <Button onClick={checkout} loading={submitting} disabled={items.length === 0}>Checkout</Button>
            {error ? <p className="text-sm text-rosewood">{error}</p> : null}
          </div>
        </aside>
      </div>
    </Section>
  );
}
