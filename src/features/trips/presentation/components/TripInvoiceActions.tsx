/**
 * TripInvoiceActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Encapsula la lógica visual de "Facturación" en el header del detalle de viaje.
 * Decide entre 3 estados según permisos y estado del viaje:
 *
 * 1. Botón "Generar factura" (cuando el viaje está completed y se puede facturar)
 * 2. Badge de estado de factura + botón "Ver factura" (cuando ya hay factura ligada)
 * 3. Nada (cuando no aplica ninguna de las anteriores)
 *
 * Extraído de TripDetailPage para limpiar el header inline.
 *
 * Ubicación: src/features/trips/presentation/components/TripInvoiceActions.tsx
 */

import { useNavigate } from "react-router-dom";
import { FileText, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { usePermissions } from "@shared/permissions";
import type { Trip } from "@features/trips/domain";
import { getTripInvoicingBadgeConfig } from "@/features/trips";

// ============================================================================
// TYPES
// ============================================================================

export interface TripInvoiceActionsProps {
  trip: Trip;
  /** Clases extra para el contenedor. */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TripInvoiceActions({ trip, className }: TripInvoiceActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canCreateInvoices = hasPermission("invoices", "create");
  const canReadInvoices = hasPermission("invoices", "read");

  const isCompletedTrip = trip.status === "completed";
  const canViewLinkedInvoice =
    (canReadInvoices || canCreateInvoices) && !!trip.invoicing.invoiceId;

  const canShowCreateInvoiceAction =
    isCompletedTrip &&
    canCreateInvoices &&
    trip.invoicing.canGenerateInvoice;

  const canShowLinkedInvoiceState =
    isCompletedTrip &&
    !trip.invoicing.canGenerateInvoice &&
    (canViewLinkedInvoice || canCreateInvoices);

  // Si ningún estado aplica, no renderizar nada (mantiene el header limpio)
  if (!canShowCreateInvoiceAction && !canShowLinkedInvoiceState) {
    return null;
  }

  if (canShowCreateInvoiceAction) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate(`/invoices/new?trip_id=${trip.id}`)}
        className={className}
      >
        <Receipt className="h-4 w-4 mr-2" />
        Generar factura
      </Button>
    );
  }

  // canShowLinkedInvoiceState: hay factura ligada o el usuario puede crearla
  const tripInvoicingConfig = getTripInvoicingBadgeConfig({
    status: trip.status,
    invoicing: trip.invoicing,
  });

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-md border px-3 py-2">
          <div className="flex items-center gap-2">
            <Badge variant={tripInvoicingConfig.variant}>
              {tripInvoicingConfig.label}
            </Badge>
            {trip.invoicing.invoiceFolio ? (
              <span className="text-xs text-muted-foreground">
                {trip.invoicing.invoiceFolio}
              </span>
            ) : null}
          </div>
        </div>
        {canViewLinkedInvoice ? (
          <Button
            variant="outline"
            onClick={() => navigate(`/invoices/${trip.invoicing.invoiceId}`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Ver factura
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default TripInvoiceActions;
