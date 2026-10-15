/**
 * Bloque de estado (éxito / error / carga) del embudo auth.
 * Homologa chrome entre Operate token (forgot, reset, verify, invite, activate).
 * F1: el título de la vista de estado es h1 (un heading principal por vista).
 */
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

type AuthFunnelStatusVariant = "success" | "error" | "info" | "loading";

const ICON_WRAP: Record<Exclude<AuthFunnelStatusVariant, "loading">, string> = {
  success: "bg-success-soft text-success",
  error: "bg-destructive/10 text-destructive",
  /** Estado neutro (p. ej. registro cerrado) — sin semántica de éxito/error. */
  info: "bg-muted text-muted-foreground",
};

type AuthFunnelStatusBlockProps = {
  variant: AuthFunnelStatusVariant;
  icon?: ReactNode;
  title?: string;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  loadingLabel?: string;
};

export function AuthFunnelStatusBlock({
  variant,
  icon,
  title,
  description,
  children,
  className,
  loadingLabel,
}: AuthFunnelStatusBlockProps) {
  if (variant === "loading") {
    return (
      <div
        className={cn("flex w-full flex-col items-center py-6", className)}
        role="status"
        aria-busy="true"
      >
        <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden />
        {loadingLabel ? (
          <p className="text-muted-foreground mt-4 text-sm">{loadingLabel}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center text-center",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            ICON_WRAP[variant],
          )}
        >
          {icon}
        </div>
      ) : null}
      {title ? (
        <h1 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>
      ) : null}
      {description ? (
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed text-balance">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
