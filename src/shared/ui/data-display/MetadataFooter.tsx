/**
 * MetadataFooter
 * Shared UI - Data Display
 *
 * Pie de página con metadata de auditoría (creado / actualizado / por).
 * Estandariza el bloque que repiten VehicleDetailPage, DriverDetailPage, etc.
 */

import { Card, CardContent } from "@shared/ui/card";
import { formatDateTime } from "@shared/utils/dateUtils";

// ============================================================================
// TYPES
// ============================================================================

export interface MetadataFooterProps {
  /** Fecha de creación (Date o ISO string). */
  createdAt?: string | Date;
  /** Fecha de última actualización (Date o ISO string). */
  updatedAt?: string | Date;
  /** Nombre del usuario que creó la entidad (texto plano). */
  createdBy?: string;
  /**
   * Nombre del usuario que realizó la última edición.
   * Si coincide con `createdBy` o no se provee, no se renderiza (evita ruido).
   */
  updatedBy?: string;
  /** Etiqueta para createdBy ("Por:", "Creado por:", etc.). */
  byLabel?: string;
  /** Etiqueta para updatedBy cuando difiera del creador. */
  updatedByLabel?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function toIso(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MetadataFooter({
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  byLabel = "Por:",
  updatedByLabel = "Última edición por:",
}: MetadataFooterProps) {
  const createdIso = toIso(createdAt);
  const updatedIso = toIso(updatedAt);

  const createdByNormalized = createdBy?.trim() || undefined;
  const updatedByNormalized = updatedBy?.trim() || undefined;
  // Mostrar "Última edición por" solo si difiere del creador y existe.
  const showUpdatedBy =
    !!updatedByNormalized && updatedByNormalized !== createdByNormalized;

  if (
    !createdIso &&
    !updatedIso &&
    !createdByNormalized &&
    !showUpdatedBy
  ) {
    return null;
  }

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {createdIso ? <span>Creado: {formatDateTime(createdIso)}</span> : null}
          {updatedIso ? (
            <span>Actualizado: {formatDateTime(updatedIso)}</span>
          ) : null}
          {createdByNormalized ? (
            <span>
              {byLabel} {createdByNormalized}
            </span>
          ) : null}
          {showUpdatedBy ? (
            <span>
              {updatedByLabel} {updatedByNormalized}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default MetadataFooter;
