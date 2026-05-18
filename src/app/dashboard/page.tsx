"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Repeat2, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, EmptyState, Field, Input, LinkButton, Section } from "@/components/ui";
import { getCustomerOrders, updateUserProfile } from "@/lib/firestore";
import { formatMoney } from "@/lib/utils";
import type { PerfumeOrder } from "@/lib/types";

export default function DashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<PerfumeOrder[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (user) getCustomerOrders(user.uid).then(setOrders);
    if (profile) setName(profile.name);
  }, [user, profile, loading, router]);

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    await updateUserProfile(user.uid, { name });
    await refreshProfile();
    setSaving(false);
  }

  function reorder(order: PerfumeOrder) {
    const encoded = btoa(JSON.stringify({
      perfumeName: order.perfumeName,
      selectedNotes: order.selectedNotes,
      specialInstructions: order.specialInstructions
    }));
    router.push(`/builder?reorder=${encodeURIComponent(encoded)}`);
  }

  if (loading || !user) return <Section><div className="glass h-80 animate-pulse rounded-[2rem]" /></Section>;

  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">My account</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">Your scent library</h1>
        </div>
        <LinkButton href="/builder">Create another</LinkButton>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="glass h-fit rounded-[1.5rem] p-6">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-rosewood" />
            <h2 className="font-serif text-3xl font-semibold">Profile</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <p className="text-sm text-ink/60">{user.email}</p>
            <Button onClick={saveProfile} loading={saving}>Update profile</Button>
          </div>
        </div>
        <div className="grid gap-4">
          {orders.length === 0 ? <EmptyState title="No orders yet" body="Your paid and pending custom scent orders will appear here." /> : null}
          {orders.map((order) => (
            <article className="glass rounded-[1.5rem] p-6" key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl font-semibold">{order.perfumeName}</h2>
                  <p className="mt-1 text-sm text-ink/60">{formatMoney(order.price)} · {order.bottleSize.name} · {order.scentStrength.name}</p>
                  {order.confirmationCode ? <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-champagne">Phone code {order.confirmationCode}</p> : null}
                </div>
                <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-moss">{order.orderStatus.replaceAll("_", " ")}</span>
              </div>
              <div className="mt-5 grid gap-2 text-sm text-ink/68 md:grid-cols-3">
                {(["top", "middle", "base"] as const).map((category) => (
                  <p key={category}><strong className="capitalize">{category}:</strong> {order.selectedNotes?.[category]?.map((n) => n.name).join(", ") || "None"}</p>
                ))}
              </div>
              <Button className="mt-5" variant="secondary" onClick={() => reorder(order)}>
                <Repeat2 className="h-4 w-4" /> Reorder scent
              </Button>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}
