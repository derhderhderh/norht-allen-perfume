"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button, EmptyState, Field, Input, Section, Select, Textarea } from "@/components/ui";
import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { getAllNotes, getAllOrders, getContactQueries, getEmailEvents, getProductOptions, getPromoCodes, saveNote, saveProductOptions, savePromoCode } from "@/lib/firestore";
import { defaultOptions } from "@/lib/default-options";
import { formatMoney } from "@/lib/utils";
import { orderStatuses, type BottleSize, type ContactQuery, type EmailEvent, type FragranceNote, type OrderStatus, type PerfumeOrder, type ProductOptions, type PromoCode, type ScentStrength } from "@/lib/types";

const blankNote = { name: "", category: "top" as const, description: "", imageUrl: "", active: true };
const blankPromo = { code: "", description: "100% off order", active: true };

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<FragranceNote[]>([]);
  const [orders, setOrders] = useState<PerfumeOrder[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [emailEvents, setEmailEvents] = useState<EmailEvent[]>([]);
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([]);
  const [options, setOptions] = useState<ProductOptions>(defaultOptions);
  const [noteForm, setNoteForm] = useState<Partial<FragranceNote> & { name: string; category: "top" | "middle" | "base" }>(blankNote);
  const [promoForm, setPromoForm] = useState<Partial<PromoCode> & { code: string }>(blankPromo);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"orders" | "notes" | "pricing" | "promos" | "emails" | "queries">("orders");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [clearText, setClearText] = useState("");
  const [queryForm, setQueryForm] = useState({ id: "", name: "", email: "", subject: "", message: "", close: false });

  async function loadData() {
    setLoadError("");
    const [notesResult, ordersResult, optionsResult, promosResult, emailsResult, queriesResult] = await Promise.allSettled([
      getAllNotes(),
      getAllOrders(),
      getProductOptions(),
      getPromoCodes(),
      getEmailEvents(),
      getContactQueries()
    ]);

    if (notesResult.status === "fulfilled") setNotes(notesResult.value);
    if (ordersResult.status === "fulfilled") setOrders(ordersResult.value);
    if (optionsResult.status === "fulfilled") setOptions(optionsResult.value);
    if (promosResult.status === "fulfilled") setPromos(promosResult.value);
    if (emailsResult.status === "fulfilled") setEmailEvents(emailsResult.value);
    if (queriesResult.status === "fulfilled") setContactQueries(queriesResult.value);

    const failed = [
      notesResult.status === "rejected" ? "notes" : "",
      ordersResult.status === "rejected" ? "orders" : "",
      optionsResult.status === "rejected" ? "pricing" : "",
      promosResult.status === "rejected" ? "promo codes" : "",
      emailsResult.status === "rejected" ? "email logs" : "",
      queriesResult.status === "rejected" ? "queries" : ""
    ].filter(Boolean);

    if (failed.length > 0) {
      setLoadError(`Some admin data could not load: ${failed.join(", ")}. Check deployed Firestore rules if this persists.`);
    }
  }

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && profile && profile.role !== "admin") router.push("/dashboard");
    if (profile?.role === "admin") loadData();
  }, [loading, profile, user, router]);

  const filteredOrders = useMemo(() => {
    const needle = query.toLowerCase();
    return orders.filter((order) => [order.customerName, order.customerEmail, order.perfumeName, order.orderStatus].join(" ").toLowerCase().includes(needle));
  }, [orders, query]);

  const revenue = orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.price, 0);

  async function submitNote(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await saveNote(noteForm);
    setNoteForm(blankNote);
    await loadData();
    setSaving(false);
  }

  async function removeNote(id: string) {
    await deleteDoc(doc(db, "notes", id));
    await loadData();
  }

  async function submitPromo(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    await savePromoCode(promoForm);
    setPromoForm(blankPromo);
    await loadData();
    setSaving(false);
  }

  async function removePromo(id: string) {
    await deleteDoc(doc(db, "promoCodes", id));
    await loadData();
  }

  async function updateStatus(order: PerfumeOrder, status: OrderStatus) {
    if (!user) return;
    const idToken = await user.getIdToken();
    await fetch(`/api/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ status })
    });
    await loadData();
  }

  async function clearOrders() {
    if (!user || clearText !== "DELETE ORDERS") return;
    const confirmed = window.confirm("This permanently removes every order from Firestore. Notes, pricing, promos, users, and queries will not be touched.");
    if (!confirmed) return;
    setSaving(true);
    const idToken = await user.getIdToken();
    const res = await fetch("/api/admin/orders", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` }
    });
    if (!res.ok) {
      const data = await res.json();
      setLoadError(data.error || "Unable to clear orders.");
    }
    setClearText("");
    await loadData();
    setSaving(false);
  }

  async function sendQueryEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const idToken = await user.getIdToken();
    const res = await fetch("/api/admin/contact-queries", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(queryForm)
    });
    if (!res.ok) {
      const data = await res.json();
      setLoadError(data.error || "Unable to send query email.");
    } else {
      setQueryForm({ id: "", name: "", email: "", subject: "", message: "", close: false });
    }
    await loadData();
    setSaving(false);
  }

  async function saveOptions() {
    setSaving(true);
    await saveProductOptions(options);
    setSaving(false);
  }

  if (loading || profile?.role !== "admin") return <Section><div className="glass h-80 animate-pulse rounded-[2rem]" /></Section>;

  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-champagne">Admin dashboard</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">Studio command center</h1>
        </div>
        <div className="flex rounded-full border border-ink/10 bg-white/60 p-1">
          {(["orders", "notes", "pricing", "promos", "queries", "emails"] as const).map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === item ? "bg-ink text-pearl" : "text-ink/65"}`}>{item}</button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="glass rounded-[1.25rem] p-5"><BarChart3 className="h-5 w-5 text-rosewood" /><p className="mt-3 text-sm text-ink/60">Paid revenue</p><p className="font-serif text-3xl font-semibold">{formatMoney(revenue)}</p></div>
        <div className="glass rounded-[1.25rem] p-5"><p className="text-sm text-ink/60">Orders</p><p className="font-serif text-3xl font-semibold">{orders.length}</p></div>
        <div className="glass rounded-[1.25rem] p-5"><p className="text-sm text-ink/60">Active notes</p><p className="font-serif text-3xl font-semibold">{notes.filter((n) => n.active).length}</p></div>
      </div>
      {loadError ? <p className="mt-4 rounded-2xl bg-rosewood/10 px-4 py-3 text-sm text-rosewood">{loadError}</p> : null}
      {tab === "orders" ? (
        <div className="mt-8 grid gap-4">
          <div className="relative"><Search className="absolute left-4 top-3.5 h-4 w-4 text-ink/45" /><Input className="pl-11" placeholder="Search orders, customers, statuses" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          {filteredOrders.length === 0 ? <EmptyState title="No orders found" body="Paid and pending orders will appear here once customers check out." /> : null}
          <div className="glass rounded-[1.5rem] border border-rosewood/20 p-6">
            <h2 className="font-serif text-3xl font-semibold text-rosewood">Clear order database</h2>
            <p className="mt-2 text-sm leading-6 text-ink/65">This removes orders only. It does not delete users, notes, pricing, promo codes, queries, or email logs. Type <strong>DELETE ORDERS</strong> to enable the button.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <Input value={clearText} onChange={(event) => setClearText(event.target.value)} placeholder="DELETE ORDERS" />
              <Button variant="secondary" loading={saving} disabled={clearText !== "DELETE ORDERS"} onClick={clearOrders}>Clear orders</Button>
            </div>
          </div>
          {filteredOrders.map((order) => (
            <article className="glass rounded-[1.5rem] p-6" key={order.id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div>
                  <h2 className="font-serif text-3xl font-semibold">{order.perfumeName}</h2>
                  <p className="text-sm text-ink/60">{order.customerName} · {order.customerEmail} · {formatMoney(order.price)}</p>
                  <p className="mt-3 text-sm text-ink/68">Payment: {order.paymentStatus}</p>
                </div>
                <Select value={order.orderStatus} onChange={(e) => updateStatus(order, e.target.value as OrderStatus)}>
                  {orderStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </Select>
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {tab === "queries" ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
          <form onSubmit={sendQueryEmail} className="glass grid h-fit gap-4 rounded-[1.5rem] p-6">
            <h2 className="font-serif text-3xl font-semibold">{queryForm.id ? "Reply to query" : "Create email query"}</h2>
            <Field label="Customer name"><Input value={queryForm.name} onChange={(e) => setQueryForm({ ...queryForm, name: e.target.value })} disabled={Boolean(queryForm.id)} required={!queryForm.id} /></Field>
            <Field label="Customer email"><Input value={queryForm.email} onChange={(e) => setQueryForm({ ...queryForm, email: e.target.value })} disabled={Boolean(queryForm.id)} required={!queryForm.id} /></Field>
            <Field label="Subject"><Input value={queryForm.subject} onChange={(e) => setQueryForm({ ...queryForm, subject: e.target.value })} required /></Field>
            <Field label="Message"><Textarea value={queryForm.message} onChange={(e) => setQueryForm({ ...queryForm, message: e.target.value })} required /></Field>
            {queryForm.id ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={queryForm.close} onChange={(e) => setQueryForm({ ...queryForm, close: e.target.checked })} /> Close query after sending</label> : null}
            <Button loading={saving}>{queryForm.id ? "Send reply" : "Create query and email customer"}</Button>
          </form>
          <div className="grid gap-3">
            {contactQueries.length === 0 ? <EmptyState title="No queries yet" body="Contact form inquiries and admin-created email threads will appear here." /> : null}
            {contactQueries.map((item) => (
              <article className="glass rounded-[1.25rem] p-5" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold">{item.subject}</h2>
                    <p className="mt-1 text-sm text-ink/60">{item.code} - {item.name} - {item.email}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${item.status === "open" ? "bg-moss/10 text-moss" : "bg-ink/10 text-ink/60"}`}>{item.status}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink/65">{item.message}</p>
                <Button className="mt-4" variant="secondary" onClick={() => setQueryForm({ id: item.id, name: item.name, email: item.email, subject: `Re: ${item.subject} [${item.code}]`, message: "", close: false })}>Reply from dashboard</Button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "notes" ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={submitNote} className="glass grid h-fit gap-4 rounded-[1.5rem] p-6">
            <h2 className="font-serif text-3xl font-semibold">{noteForm.id ? "Edit note" : "Add note"}</h2>
            <Field label="Name"><Input value={noteForm.name} onChange={(e) => setNoteForm({ ...noteForm, name: e.target.value })} required /></Field>
            <Field label="Category"><Select value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as "top" | "middle" | "base" })}><option value="top">Top</option><option value="middle">Middle / heart</option><option value="base">Base</option></Select></Field>
            <Field label="Description"><Textarea value={noteForm.description || ""} onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })} /></Field>
            <Field label="Image or icon URL"><Input value={noteForm.imageUrl || ""} onChange={(e) => setNoteForm({ ...noteForm, imageUrl: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={noteForm.active ?? true} onChange={(e) => setNoteForm({ ...noteForm, active: e.target.checked })} /> Active</label>
            <Button loading={saving}><Plus className="h-4 w-4" /> Save note</Button>
          </form>
          <div className="grid gap-3">
            {notes.map((note) => (
              <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] p-4" key={note.id}>
                <button className="text-left" onClick={() => setNoteForm(note)}>
                  <strong>{note.name}</strong>
                  <span className="ml-3 rounded-full bg-ink/5 px-2 py-1 text-xs capitalize">{note.category}</span>
                  <p className="mt-1 text-sm text-ink/60">{note.description || "No description"}</p>
                </button>
                <Button variant="ghost" onClick={() => removeNote(note.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "pricing" ? <PricingEditor options={options} setOptions={setOptions} save={saveOptions} saving={saving} /> : null}
      {tab === "promos" ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <form onSubmit={submitPromo} className="glass grid h-fit gap-4 rounded-[1.5rem] p-6">
            <h2 className="font-serif text-3xl font-semibold">{promoForm.id ? "Edit promo" : "Add promo"}</h2>
            <Field label="Code"><Input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} required /></Field>
            <Field label="Description"><Input value={promoForm.description || ""} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={promoForm.active ?? true} onChange={(e) => setPromoForm({ ...promoForm, active: e.target.checked })} /> Active</label>
            <p className="text-xs leading-5 text-ink/55">Promo codes currently apply 100% off the bag total.</p>
            <Button loading={saving}><Plus className="h-4 w-4" /> Save promo</Button>
          </form>
          <div className="grid gap-3">
            {promos.length === 0 ? <EmptyState title="No promo codes yet" body="Create a code here or use the PROMO_CODES environment variable for private 100% off codes." /> : null}
            {promos.map((promo) => (
              <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] p-4" key={promo.id}>
                <button className="text-left" onClick={() => setPromoForm(promo)}>
                  <strong>{promo.code}</strong>
                  <span className="ml-3 rounded-full bg-ink/5 px-2 py-1 text-xs">{promo.active ? "Active" : "Inactive"}</span>
                  <p className="mt-1 text-sm text-ink/60">{promo.description || "100% off order"}</p>
                </button>
                <Button variant="ghost" onClick={() => removePromo(promo.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "emails" ? (
        <div className="mt-8 grid gap-3">
          {emailEvents.length === 0 ? <EmptyState title="No email events yet" body="Paid order, promo, and status emails will be logged here after the app attempts to send them." /> : null}
          {emailEvents.map((event) => (
            <article className="glass rounded-[1.25rem] p-5" key={event.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-semibold">{event.subject}</h2>
                  <p className="mt-1 text-sm text-ink/60">{event.type.replaceAll("_", " ")} - {event.to.join(", ")}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${event.status === "sent" ? "bg-moss/10 text-moss" : event.status === "failed" ? "bg-rosewood/10 text-rosewood" : "bg-ink/10 text-ink/60"}`}>{event.status}</span>
              </div>
              {event.resendId ? <p className="mt-3 text-xs text-ink/55">Resend id: {event.resendId}</p> : null}
              {event.error ? <p className="mt-3 text-sm text-rosewood">{event.error}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </Section>
  );
}

function PricingEditor({ options, setOptions, save, saving }: { options: ProductOptions; setOptions: (options: ProductOptions) => void; save: () => void; saving: boolean }) {
  function slug(value: string) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || crypto.randomUUID();
  }

  function addSize() {
    setOptions({
      ...options,
      bottleSizes: [
        ...options.bottleSizes,
        { id: `size-${crypto.randomUUID()}`, name: "New Bottle", ml: 50, price: 100, active: true }
      ]
    });
  }

  function addStrength() {
    setOptions({
      ...options,
      scentStrengths: [
        ...options.scentStrengths,
        { id: `strength-${crypto.randomUUID()}`, name: "New Strength", description: "", priceModifier: 0, active: true }
      ]
    });
  }

  function updateSize(index: number, patch: Partial<BottleSize>) {
    setOptions({
      ...options,
      bottleSizes: options.bottleSizes.map((item, i) => {
        const next = i === index ? { ...item, ...patch } : item;
        return patch.name && item.id.startsWith("size-") ? { ...next, id: slug(patch.name) } : next;
      })
    });
  }
  function updateStrength(index: number, patch: Partial<ScentStrength>) {
    setOptions({
      ...options,
      scentStrengths: options.scentStrengths.map((item, i) => {
        const next = i === index ? { ...item, ...patch } : item;
        return patch.name && item.id.startsWith("strength-") ? { ...next, id: slug(patch.name) } : next;
      })
    });
  }

  function removeSize(index: number) {
    setOptions({ ...options, bottleSizes: options.bottleSizes.filter((_, i) => i !== index) });
  }

  function removeStrength(index: number) {
    setOptions({ ...options, scentStrengths: options.scentStrengths.filter((_, i) => i !== index) });
  }

  return (
    <div className="mt-8 grid gap-6">
      <div className="glass rounded-[1.5rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl font-semibold">Bottle sizes</h2>
          <Button type="button" variant="secondary" onClick={addSize}><Plus className="h-4 w-4" /> Add size</Button>
        </div>
        <div className="mt-5 grid gap-3">
          {options.bottleSizes.map((size, index) => (
            <div key={size.id} className="grid gap-3 md:grid-cols-[1fr_120px_140px_110px_52px]">
              <Input value={size.name} onChange={(e) => updateSize(index, { name: e.target.value })} />
              <Input type="number" value={size.ml} onChange={(e) => updateSize(index, { ml: Number(e.target.value) })} />
              <Input type="number" value={size.price} onChange={(e) => updateSize(index, { price: Number(e.target.value) })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={size.active} onChange={(e) => updateSize(index, { active: e.target.checked })} /> Active</label>
              <Button type="button" variant="ghost" onClick={() => removeSize(index)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-[1.5rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-3xl font-semibold">Scent strengths</h2>
          <Button type="button" variant="secondary" onClick={addStrength}><Plus className="h-4 w-4" /> Add strength</Button>
        </div>
        <div className="mt-5 grid gap-3">
          {options.scentStrengths.map((strength, index) => (
            <div key={strength.id} className="grid gap-3 md:grid-cols-[1fr_1fr_140px_110px_52px]">
              <Input value={strength.name} onChange={(e) => updateStrength(index, { name: e.target.value })} />
              <Input value={strength.description} onChange={(e) => updateStrength(index, { description: e.target.value })} />
              <Input type="number" value={strength.priceModifier} onChange={(e) => updateStrength(index, { priceModifier: Number(e.target.value) })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={strength.active} onChange={(e) => updateStrength(index, { active: e.target.checked })} /> Active</label>
              <Button type="button" variant="ghost" onClick={() => removeStrength(index)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
      <div className="glass grid gap-4 rounded-[1.5rem] p-6 md:grid-cols-2">
        <Field label="Included notes"><Input type="number" value={options.pricingRules.includedNotes} onChange={(e) => setOptions({ ...options, pricingRules: { ...options.pricingRules, includedNotes: Number(e.target.value) } })} /></Field>
        <Field label="Extra note price"><Input type="number" value={options.pricingRules.extraNotePrice} onChange={(e) => setOptions({ ...options, pricingRules: { ...options.pricingRules, extraNotePrice: Number(e.target.value) } })} /></Field>
        <Field label="Maximum notes per scent"><Input type="number" value={options.pricingRules.maxNotes ?? 12} onChange={(e) => setOptions({ ...options, pricingRules: { ...options.pricingRules, maxNotes: Number(e.target.value) } })} /></Field>
      </div>
      <Button onClick={save} loading={saving}>Save pricing</Button>
    </div>
  );
}
