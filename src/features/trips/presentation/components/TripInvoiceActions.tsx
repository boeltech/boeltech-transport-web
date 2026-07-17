/**
 * TripInvoiceActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Encapsula la lógica visual de "Facturación" en el header del detalle de viaje.
 * La habilitación de "Generar factura" sigue `trip.invoicing.canGenerateInvoice` del API
 * (pre-stamp v2 puede permitirla antes de completar el viaje).
 *
 * ADR-0068: «Facturar servicios adicionales» cuando `canGenerateAccessoryInvoice`.
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

  const canShowCreateInvoiceAction =
    canCreateInvoices && trip.invoicing.canGenerateInvoice;

  const canShowAccessoryInvoiceAction =
    canCreateInvoices && trip.invoicing.canGenerateAccessoryInvoice;

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
    (hasInvoiceEvidence || canShowAccessoryInvoiceAction) &&
    (canViewLinkedInvoice || canCreateInvoices || canShowAccessoryInvoiceAction);

  if (
    !canShowCreateInvoiceAction &&
    !canShowLinkedInvoiceState &&
    !canShowAccessoryInvoiceAction
  ) {
    return null;
  }

  const createPrimaryHref = `/invoices/new?trip_id=${trip.id}`;
  const createAccessoryHref = `/invoices/new?trip_id=${trip.id}&scope=accessory`;

  if (canShowCreateInvoiceAction) {
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
            <DropdownMenuItem onSelect={() => navigate(createPrimaryHref)}>
              <Receipt className="mr-2 h-4 w-4" />
              {copy.generatePrimary}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      <Button
        variant="outline"
        onClick={() => navigate(createPrimaryHref)}
        className={className}
      >
        <Receipt className="h-4 w-4 mr-2" />
        {copy.generatePrimary}
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
