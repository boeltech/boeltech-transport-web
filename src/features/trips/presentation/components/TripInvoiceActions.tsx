/**
 * TripInvoiceActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Encapsula la lógica visual de "Facturación" en el header del detalle de viaje.
 * La habilitación de "Generar factura" sigue `trip.invoicing.canGenerateInvoice` del API
 * (pre-stamp v2 puede permitirla antes de completar el viaje).
 *
 * Muestra estado de factura ligada (borrador / timbrada / etc.) y enlace a detalle cuando aplica.
 *
 * Ubicación: src/features/trips/presentation/components/TripInvoiceActions.tsx
 */

import { useNavigate } from "react-router-dom";
import { ChevronDown, FileText, Receipt } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usePermissions } from "@shared/permissions";
import type { Trip } from "@features/trips/domain";
import { getTripInvoicingBadgeConfig } from "@features/trips";

// ============================================================================
// TYPES
// ============================================================================

export interface TripInvoiceActionsProps {
  trip: Trip;
  /** Clases extra para el contenedor. */
  className?: string;
  /**
   * `inline`: botones/badges en fila (listados, compatibilidad).
   * `headerMenu`: un solo disparador «Facturación» con menú (detalle de viaje).
   */
  presentation?: "inline" | "headerMenu";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TripInvoiceActions({
  trip,
  className,
  presentation = "inline",
}: TripInvoiceActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canCreateInvoices = hasPermission("invoices", "create");
  const canReadInvoices = hasPermission("invoices", "read");

  const canViewLinkedInvoice =
    (canReadInvoices || canCreateInvoices) && !!trip.invoicing.invoiceId;

  const canShowCreateInvoiceAction =
    canCreateInvoices && trip.invoicing.canGenerateInvoice;

  const hasInvoiceEvidence =
    !!trip.invoicing.invoiceId ||
    !!trip.invoicing.invoiceFolio ||
    trip.invoicing.invoiceStatus !== null ||
    !!trip.invoicing.invoiceCfdiUuid;

  const canShowLinkedInvoiceState =
    !trip.invoicing.canGenerateInvoice &&
    hasInvoiceEvidence &&
    (canViewLinkedInvoice || canCreateInvoices);

  // Si ningún estado aplica, no renderizar nada (mantiene el header limpio)
  if (!canShowCreateInvoiceAction && !canShowLinkedInvoiceState) {
    return null;
  }

  if (canShowCreateInvoiceAction) {
    if (presentation === "headerMenu") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={className}>
              <Receipt className="h-4 w-4 shrink-0" />
              <span className="mx-1.5">Facturación</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onSelect={() => navigate(`/invoices/new?trip_id=${trip.id}`)}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Generar factura
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
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

  if (presentation === "headerMenu") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Receipt className="h-4 w-4 shrink-0" />
            <span className="mx-1.5">Facturación</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={tripInvoicingConfig.variant}>
                  {tripInvoicingConfig.label}
                </Badge>
                {trip.invoicing.invoiceFolio ? (
                  <span className="text-xs text-muted-foreground">
                    Folio {trip.invoicing.invoiceFolio}
                  </span>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>
          {canViewLinkedInvoice ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  navigate(`/invoices/${trip.invoicing.invoiceId}`)
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver factura
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

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
