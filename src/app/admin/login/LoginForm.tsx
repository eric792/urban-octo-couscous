"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";
import { login } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { ActionState } from "@/types";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(login, { ok: false });
  // Controlled so React's post-action form reset keeps the email (password still clears).
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="admin-label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="admin-input" />
      </div>
      <div>
        <label htmlFor="password" className="admin-label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="admin-input" />
      </div>
      {state.message && <p className="text-sm text-rose-300" role="alert">{state.message}</p>}
      <SubmitButton pendingText="Signing in…" className="w-full">
        <Lock className="h-4 w-4" /> Sign in
      </SubmitButton>
    </form>
  );
}
