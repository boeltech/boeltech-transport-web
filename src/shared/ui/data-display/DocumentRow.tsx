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
  /** Número o folio del documento. `null` muestra `emptyLabel`. */
  documentNumber: string | null;
  /**
   * Fecha ISO de vencimiento.
   * - Con folio y sin fecha → badge `noExpirationLabel` (el dato está incompleto).
   * - Sin folio ni fecha → solo `emptyLabel`, sin badge.
   */
  expirationDate: string | null;
  /** Texto cuando no hay folio. Por defecto "No registrado". */
  emptyLabel?: string;
  /** Badge cuando hay folio pero falta la fecha. Por defecto "Sin fecha de vencimiento". */
  noExpirationLabel?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

type ExpirationBadgeVariant =
  | "destructive"
  | "warning"
  | "secondary"
  | "default";

function getExpirationBadgeVariant(
  date: string | null,
): ExpirationBadgeVariant | null {
  if (!date) return null;
  const days = getDaysUntilDateString(date);
  if (days === null) return "secondary";
  if (days <= 0) return "destructive";
  if (days <= 30) return "warning";
  if (days <= 90) return "secondary";
  return "default";
}

function hasText(value: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentRow({
  label,
  documentNumber,
  expirationDate,
  emptyLabel = "No registrado",
  noExpirationLabel = "Sin fecha de vencimiento",
}: DocumentRowProps) {
  const expired = isExpired(expirationDate);
  const expiringSoon = isExpiringSoon(expirationDate);
  const daysUntil = getDaysUntilDateString(expirationDate);
  const badgeVariant = getExpirationBadgeVariant(expirationDate);
  const badgeTone =
    badgeVariant === "destructive" || badgeVariant === "warning"
      ? "soft"
      : undefined;
  // Folio capturado sin vigencia: dato incompleto, se señala en vez de ocultar el badge.
  const missingExpiration = hasText(documentNumber) && !hasText(expirationDate);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="space-y-1">
        <div className="text-sm font-medium">{label}</div>
        <p className="text-sm text-muted-foreground font-mono">
          {documentNumber || emptyLabel}
        </p>
      </div>
      <div className="text-right space-y-1">
        <p
          className={cn(
            "text-sm",
            expired && "text-destructive",
            expiringSoon && "text-warning",
          )}
        >
          {formatDate(expirationDate)}
        </p>
        {badgeVariant ? (
          <Badge variant={badgeVariant} tone={badgeTone} className="text-xs">
            {expired
              ? "Vencido"
              : expiringSoon
                ? `${daysUntil} días`
                : "Vigente"}
          </Badge>
        ) : missingExpiration ? (
          <Badge variant="warning" tone="soft" className="text-xs">
            {noExpirationLabel}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

export default DocumentRow;
