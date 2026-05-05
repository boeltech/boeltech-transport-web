/**
 * DocumentRow
 * Shared UI - Data Display
 *
 * Fila para listar un documento con número, fecha de vencimiento y estado.
 * Patrón usado en VehicleDetailPage (tab "Documentos") y previsto para
 * conductores y empleados.
 */

import type { ReactNode } from "react";
import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import {
  formatDate,
  getDaysUntilDateString,
  isExpired,
  isExpiringSoon,
} from "@shared/utils/dateUtils";

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentRowProps {
  /** Etiqueta del documento (texto o `SatFieldLabel`). */
  label: ReactNode;
  /** Número o folio del documento. `null` muestra "No registrado". */
  documentNumber: string | null;
  /** Fecha ISO de vencimiento. `null` oculta el badge de estado. */
  expirationDate: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

type ExpirationVariant = "destructive" | "outline" | "secondary" | "default";

function getExpirationVariant(date: string | null): ExpirationVariant {
  const days = getDaysUntilDateString(date);
  if (days === null) return "secondary";
  if (days <= 0) return "destructive";
  if (days <= 30) return "outline";
  if (days <= 90) return "secondary";
  return "default";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentRow({
  label,
  documentNumber,
  expirationDate,
}: DocumentRowProps) {
  const expired = isExpired(expirationDate);
  const expiringSoon = isExpiringSoon(expirationDate);
  const daysUntil = getDaysUntilDateString(expirationDate);
  const variant = getExpirationVariant(expirationDate);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <p className="text-sm text-muted-foreground font-mono">
          {documentNumber || "No registrado"}
        </p>
      </div>
      <div className="text-right space-y-1">
        <p
          className={cn(
            "text-sm",
            expired && "text-destructive",
            expiringSoon && "text-amber-600 dark:text-amber-500",
          )}
        >
          {formatDate(expirationDate)}
        </p>
        {expirationDate ? (
          <Badge
            variant={variant}
            className={cn(
              "text-xs",
              variant === "outline" &&
                "border-amber-500 text-amber-800 dark:text-amber-200",
            )}
          >
            {expired
              ? "Vencido"
              : expiringSoon
                ? `${daysUntil} días`
                : "Vigente"}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export default DocumentRow;
