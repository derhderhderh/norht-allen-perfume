"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { useBag } from "@/components/bag-provider";
import { LinkButton } from "@/components/ui";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Builder", "/builder"],
  ["Shop", "/shop"],
  ["FAQ", "/faq"],
  ["Contact", "/contact"]
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const { items } = useBag();

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-pearl/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/north-allen-logo.png" alt="North Allen Perfumery" width={44} height={44} className="h-11 w-11 rounded-full object-cover" priority />
          <span className="font-serif text-xl font-bold tracking-wide">North Allen Perfumery</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 lg:flex">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-ink">
              {label}
            </Link>
          ))}
          {profile?.role === "admin" ? <Link href="/admin">Admin</Link> : null}
          {user ? <Link href="/dashboard">Dashboard</Link> : null}
          {user ? <Link href="/bag" className="inline-flex items-center gap-1"><ShoppingBag className="h-4 w-4" /> Bag ({items.length})</Link> : null}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <button className="text-sm font-semibold text-ink/70 hover:text-ink" onClick={() => signOut(auth)}>
              Sign out
            </button>
          ) : (
            <LinkButton href="/login" variant="secondary">
              Login
            </LinkButton>
          )}
          <LinkButton href="/builder">Create Scent</LinkButton>
        </div>
        <button className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div className="grid gap-3 border-t border-white/60 bg-pearl px-5 py-5 lg:hidden">
          {links.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="py-2 text-sm font-semibold">
              {label}
            </Link>
          ))}
          {user ? <Link href="/dashboard">Dashboard</Link> : <Link href="/login">Login</Link>}
          {user ? <Link href="/bag">Bag ({items.length})</Link> : null}
          {profile?.role === "admin" ? <Link href="/admin">Admin</Link> : null}
        </div>
      ) : null}
    </header>
  );
}
