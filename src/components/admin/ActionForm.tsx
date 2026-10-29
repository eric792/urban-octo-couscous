"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { PendingContext } from "@/components/ui/pending-context";
import { safeAction } from "@/lib/client-fetch";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/types";

/**
 * Wraps a server action and shows its success / error message inline.
 * Submits through startTransition instead of <form action> so React 19 doesn't
 * wipe what the user typed when the server returns a validation error.
 */
export function ActionForm({
  action,
  children,
  className,
  confirmText,
  messageClassName,
  resetOnSuccess = false,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  confirmText?: string;
  messageClassName?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(safeAction(action), { ok: false });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && state.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmText && !window.confirm(confirmText)) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      {state.message && !pending && (
        <p className={cn("mt-2 text-xs", state.ok ? "text-emerald-300" : "text-rose-300", messageClassName)} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
