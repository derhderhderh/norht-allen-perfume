import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-pearl">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <h2 className="font-serif text-3xl font-semibold">North Allen Perfumery</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-pearl/70">
            Custom perfume and cologne composed with boutique care in North Allen.
          </p>
        </div>
        <div className="grid gap-2 text-sm text-pearl/75">
          <Link href="/builder">Custom builder</Link>
          <Link href="/bag">Shopping bag</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/dashboard">My orders</Link>
        </div>
        <div className="text-sm leading-6 text-pearl/70">
          <p>North Allen, Texas</p>
          <p>orders@northallenperfumery.com</p>
        </div>
      </div>
    </footer>
  );
}
