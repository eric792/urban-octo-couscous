import Link from "next/link";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  href: string;
}

/** Consistent "nothing here yet" panel for the store (gold/serif) and admin (compact). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = "store",
  className,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: React.ReactNode;
  action?: Action;
  secondaryAction?: Action;
  variant?: "store" | "admin";
  className?: string;
}) {
  const store = variant === "store";
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        store ? "card gap-4 px-6 py-20" : "gap-2 px-6 py-12",
        className,
      )}
    >
      {Icon && <Icon className={store ? "h-10 w-10 text-gold-600" : "h-8 w-8 text-zinc-600"} strokeWidth={1.4} />}
      <p className={store ? "font-serif text-2xl text-white" : "font-medium text-zinc-200"}>{title}</p>
      {description && <p className={cn("max-w-md text-sm", store ? "text-zinc-500" : "text-zinc-500")}>{description}</p>}
      {(action || secondaryAction) && (
        <div className={cn("flex flex-wrap justify-center gap-3", store ? "mt-2" : "mt-3")}>
          {action && (
            <Link href={action.href} className={store ? "btn-gold" : "admin-btn"}>
              {action.label}
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href} className={store ? "btn-outline" : "admin-btn-secondary"}>
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
