"use client";

import { useContext } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { PendingContext } from "@/components/ui/pending-context";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingText,
  className,
  variant = "gold",
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingText?: string;
  variant?: "gold" | "outline" | "ghost" | "danger" | "admin" | "admin-secondary" | "plain";
}) {
  const status = useFormStatus();
  const contextPending = useContext(PendingContext);
  const pending = status.pending || contextPending;
  const styles = {
    gold: "btn-gold",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-danger",
    admin: "admin-btn",
    "admin-secondary": "admin-btn-secondary",
    plain: "inline-flex items-center gap-1.5 disabled:opacity-50",
  };
  return (
    <button type="submit" {...rest} disabled={pending || disabled} className={cn(styles[variant], className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      <span className="inline-flex items-center gap-2">{pending && pendingText ? pendingText : children}</span>
    </button>
  );
}
