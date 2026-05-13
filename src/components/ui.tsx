"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost"; loading?: boolean }) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-ink text-pearl shadow-glow hover:bg-rosewood",
        variant === "secondary" && "border border-champagne/50 bg-pearl/70 text-ink hover:bg-champagne/15",
        variant === "ghost" && "text-ink hover:bg-ink/5",
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {props.children}
    </button>
  );
}

export function LinkButton({ className, variant = "primary", ...props }: React.ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <Link
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition",
        variant === "primary" && "bg-ink text-pearl shadow-glow hover:bg-rosewood",
        variant === "secondary" && "border border-champagne/50 bg-pearl/70 text-ink hover:bg-champagne/15",
        variant === "ghost" && "text-ink hover:bg-ink/5",
        className
      )}
      {...props}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="focus-ring w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm shadow-sm" {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="focus-ring min-h-28 w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm shadow-sm" {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="focus-ring w-full rounded-2xl border border-ink/10 bg-white/70 px-4 py-3 text-sm shadow-sm" {...props} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink/75">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24", className)}>{children}</section>;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-[2rem] p-8 text-center">
      <h3 className="font-serif text-2xl font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">{body}</p>
    </div>
  );
}
