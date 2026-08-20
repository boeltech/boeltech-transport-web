/**
 * TripInvoiceActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Encapsula la lógica visual de "Facturación" en el header del detalle de viaje.
 * La habilitación de "Facturar" sigue `trip.invoicing.canGenerateInvoice`
 * del API (status invoiceable + ruta CP-ready + ≥1 carga; ver handoff
 * cerrar-cta-factura-operacion-sat).
 *
 * ADR-0068: «Facturar servicios adicionales» cuando `canGenerateAccessoryInvoice`
 * (primaria activa + ruta CP-ready).
 *
 * ADR-0079: si `operationalOutcome=false_trip`, no se ofrece CTA de flete+CP;
 * el ingreso sin CP usa `?scope=false_trip` cuando `canGenerateFalseTripInvoice`.
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
import { getTripInvoicingBadgeConfig, toDetailInvoicingBadge } from "@features/trips";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";

const copy = tripFiscalCopy.invoiceActions;

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

  const isFalseTripOutcome = trip.operationalOutcome === "false_trip";

  const canShowCreateInvoiceAction =
    canCreateInvoices &&
    trip.invoicing.canGenerateInvoice &&
    !isFalseTripOutcome;

  const canShowFalseTripInvoiceAction =
    canCreateInvoices && trip.invoicing.canGenerateFalseTripInvoice;

  const canShowAccessoryInvoiceAction =
    canCreateInvoices &&
    trip.invoicing.canGenerateAccessoryInvoice &&
    !isFalseTripOutcome;

  const accessoryInvoices = trip.invoicing.accessoryInvoices ?? [];
  const canViewAccessories =
    (canReadInvoices || canCreateInvoices) && accessoryInvoices.length > 0;

  const hasInvoiceEvidence =
    !!trip.invoicing.invoiceId ||
    !!trip.invoicing.invoiceFolio ||
    trip.invoicing.invoiceStatus !== null ||
    !!trip.invoicing.invoiceCfdiUuid ||
    accessoryInvoices.length > 0;

  const canShowLinkedInvoiceState =
    !trip.invoicing.canGenerateInvoice &&
    !canShowFalseTripInvoiceAction &&
    (hasInvoiceEvidence || canShowAccessoryInvoiceAction) &&
    (canViewLinkedInvoice || canCreateInvoices || canShowAccessoryInvoiceAction);

  if (
    !canShowCreateInvoiceAction &&
    !canShowFalseTripInvoiceAction &&
    !canShowLinkedInvoiceState &&
    !canShowAccessoryInvoiceAction
  ) {
    return null;
  }

  const createPrimaryHref = `/invoices/new?trip_id=${trip.id}`;
  const createFalseTripHref = `/invoices/new?trip_id=${trip.id}&scope=false_trip`;
  const createAccessoryHref = `/invoices/new?trip_id=${trip.id}&scope=accessory`;

  if (canShowCreateInvoiceAction || canShowFalseTripInvoiceAction) {
    const createHref = canShowFalseTripInvoiceAction
      ? createFalseTripHref
      : createPrimaryHref;
    if (presentation === "headerMenu") {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={className}>
              <Receipt className="h-4 w-4 shrink-0" />
              <span className="mx-1.5">{copy.menuLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => navigate(createHref)}>
              <Receipt className="mr-2 h-4 w-4" />
              {canShowFalseTripInvoiceAction
                ? copy.generateFalseTrip
                : copy.generatePrimary}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Button
        variant="outline"
        onClick={() => navigate(createHref)}
        className={className}
      >
        <Receipt className="h-4 w-4 mr-2" />
        {canShowFalseTripInvoiceAction
          ? copy.generateFalseTrip
          : copy.generatePrimary}
      </Button>
    );
  }

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
            <span className="mx-1.5">{copy.menuLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={tripInvoicingConfig.variant}>
                  {toDetailInvoicingBadge(tripInvoicingConfig).label}
                </Badge>
                {trip.invoicing.invoiceFolio ? (
                  <span className="text-xs text-muted-foreground">
                    Folio {trip.invoicing.invoiceFolio}
                  </span>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>
          {canViewLinkedInvoice || canViewAccessories || canShowAccessoryInvoiceAction ? (
            <DropdownMenuSeparator />
          ) : null}
          {canViewLinkedInvoice ? (
            <DropdownMenuItem
              onSelect={() => navigate(`/invoices/${trip.invoicing.invoiceId}`)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {copy.viewPrimary}
            </DropdownMenuItem>
          ) : null}
          {accessoryInvoices.map((inv) => (
            <DropdownMenuItem
              key={inv.id}
              onSelect={() => navigate(`/invoices/${inv.id}`)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {copy.viewAccessory(inv.folio)}
            </DropdownMenuItem>
          ))}
          {canShowAccessoryInvoiceAction ? (
            <DropdownMenuItem onSelect={() => navigate(createAccessoryHref)}>
              <Receipt className="mr-2 h-4 w-4" />
              {copy.generateAccessory}
            </DropdownMenuItem>
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
            {copy.viewPrimary}
          </Button>
        ) : null}
        {canShowAccessoryInvoiceAction ? (
          <Button variant="outline" onClick={() => navigate(createAccessoryHref)}>
            <Receipt className="h-4 w-4 mr-2" />
            {copy.generateAccessory}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default TripInvoiceActions;
