"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/firestore";
import { Button, Field, Input, Section } from "@/components/ui";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const name = String(form.get("name") || email.split("@")[0]);
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await ensureUserProfile(cred.user.uid, { name, email });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section className="grid min-h-[70vh] place-items-center">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-[2rem] p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-champagne">{mode === "login" ? "Welcome back" : "Create account"}</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold">{mode === "login" ? "Login" : "Register"}</h1>
        <div className="mt-6 grid gap-4">
          {mode === "register" ? <Field label="Name"><Input name="name" required /></Field> : null}
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Password"><Input name="password" type="password" minLength={6} required /></Field>
          <Button loading={loading}>{mode === "login" ? "Login" : "Create account"}</Button>
          {error ? <p className="text-sm text-rosewood">{error}</p> : null}
        </div>
        <button type="button" className="mt-5 text-sm font-semibold text-rosewood" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
      </form>
    </Section>
  );
}
