import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";

export interface FinanceSectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

/**
 * Encabezado de sección Finanzas (rutas propias bajo /finance/*).
 * Sustituye el header del antiguo hub con tabs.
 */
export function FinanceSectionHeader({
  icon,
  title,
  subtitle,
  backHref,
  backLabel,
  className,
}: FinanceSectionHeaderProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {backHref ? (
        <Button variant="ghost" size="icon" className="mt-1 shrink-0" asChild>
          <Link to={backHref} aria-label={backLabel ?? "Volver"}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
