"use client";

import { useActionState, useState } from "react";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionState } from "@/types";

export function NewsletterForm({ source = "homepage" }: { source?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(subscribeToNewsletter, { ok: false });
  const [email, setEmail] = useState("");

  if (state.ok) {
    return <p className="font-serif text-xl text-gold-300">{state.message}</p>;
  }

  return (
    <form action={action} className="w-full max-w-lg">
      <input type="hidden" name="source" value={source} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`newsletter-${source}`} className="sr-only">Email address</label>
        <input
          id={`newsletter-${source}`}
          name="email"
          type="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input flex-1"
          autoComplete="email"
        />
        <SubmitButton pendingText="Joining…">Join</SubmitButton>
      </div>
      {state.message && <p className="field-error">{state.message}</p>}
      <p className="mt-3 text-xs text-zinc-500">Unsubscribe anytime. We respect your privacy under POPIA.</p>
    </form>
  );
}
