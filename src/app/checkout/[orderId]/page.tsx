"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/components/auth-provider";
import { LinkButton, Section } from "@/components/ui";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export default function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { user, loading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!user) return;
      if (!stripePromise) {
        setError("Checkout is not configured yet.");
        return;
      }
      const idToken = await user.getIdToken();
      try {
        const res = await fetch(`/api/checkout/${orderId}`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        const data = await res.json();
        if (res.ok) setClientSecret(data.clientSecret);
        else setError(data.error || "Checkout is unavailable.");
      } catch {
        setError("Checkout is unavailable. Please try again.");
      }
    }
    if (!loading) load();
  }, [user, loading, orderId]);

  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">Secure checkout</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">Complete your order</h1>
        <p className="mt-4 text-ink/65">Finish your order securely without leaving North Allen Perfumery.</p>
        <div className="glass mt-8 rounded-[1.5rem] p-4">
          {!loading && !user ? (
            <div className="grid min-h-80 place-items-center text-center text-sm text-ink/65">
              <div>
                <p>Please sign in to continue checkout.</p>
                <LinkButton href="/login" className="mt-5">Login</LinkButton>
              </div>
            </div>
          ) : clientSecret && stripePromise ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <div className="grid min-h-80 place-items-center text-sm text-ink/60">{error || "Loading checkout..."}</div>
          )}
        </div>
      </div>
    </Section>
  );
}
