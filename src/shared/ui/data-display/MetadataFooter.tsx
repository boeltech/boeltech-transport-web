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
  /** Usuario que creó/actualizó (texto plano). */
  createdBy?: string;
  /** Etiqueta para createdBy ("Por:", "Creado por:", etc.). */
  byLabel?: string;
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
  byLabel = "Por:",
}: MetadataFooterProps) {
  const createdIso = toIso(createdAt);
  const updatedIso = toIso(updatedAt);

  if (!createdIso && !updatedIso && !createdBy) {
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
          {createdBy ? (
            <span>
              {byLabel} {createdBy}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default MetadataFooter;
