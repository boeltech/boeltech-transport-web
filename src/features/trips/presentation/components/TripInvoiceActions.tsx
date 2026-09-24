/**
 * TripInvoiceActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Encapsula la lógica visual de "Facturación" en el header del detalle de viaje.
 *
 * ADR-0068: servicios adicionales · ADR-0079: viaje en falso · ADR-0081: reparto del flete.
 */

import { useNavigate } from "react-router-dom";
import { ChevronDown, FileText, Receipt, Users } from "lucide-react";
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
import { TripStatus, type Trip } from "@features/trips/domain";
import { getTripInvoicingBadgeConfig, toDetailInvoicingBadge } from "@features/trips";
import { useTripRevenueSplit } from "@features/trips/application";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import { canUpsertTripRevenueSplit } from "./trip-fiscal/tripFiscalHelpers";

const copy = tripFiscalCopy.invoiceActions;

export interface TripInvoiceActionsProps {
  trip: Trip;
  className?: string;
  presentation?: "inline" | "headerMenu";
  onOpenRevenueSplit?: () => void;
}

function legLabel(leg: {
  clientRfc: string | null;
  clientLegalName: string | null;
  clientId: string;
}): string {
  return leg.clientLegalName || leg.clientRfc || leg.clientId.slice(0, 8);
}

function splitInvoiceHref(
  tripId: string,
  legId: string,
  attachCartaPorte: boolean,
): string {
  const params = new URLSearchParams({
    trip_id: tripId,
    scope: "split_share",
    leg_id: legId,
  });
  if (attachCartaPorte) params.set("attach_carta_porte", "1");
  return `/invoices/new?${params.toString()}`;
}

export function TripInvoiceActions({
  trip,
  className,
  presentation = "inline",
  onOpenRevenueSplit,
}: TripInvoiceActionsProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canCreateInvoices = hasPermission("invoices", "create");
  const canReadInvoices = hasPermission("invoices", "read");
  const canUpdateTrip = hasPermission("trips", "update");
  const canReadTrip = hasPermission("trips", "read");

  const canViewLinkedInvoice =
    (canReadInvoices || canCreateInvoices) && !!trip.invoicing.invoiceId;

  const isFalseTripOutcome = trip.operationalOutcome === "false_trip";
  /** ADR-0096: sin ciclo CFDI — ocultar Facturar / false_trip / split / accesorio. */
  const isSinCfdiEfectivo = trip.cfdiEmissionIntent === "sin_cfdi_efectivo";
  /** Defensa local: viaje cancelado no ofrece CTAs de create (no solo flags API). */
  const isTripCancelled = trip.status === TripStatus.CANCELLED;

  const canShowCreateInvoiceAction =
    !isSinCfdiEfectivo &&
    !isTripCancelled &&
    canCreateInvoices &&
    trip.invoicing.canGenerateInvoice &&
    !isFalseTripOutcome &&
    !trip.invoicing.hasActiveSplit;

  const canShowFalseTripInvoiceAction =
    !isSinCfdiEfectivo &&
    !isTripCancelled &&
    canCreateInvoices &&
    trip.invoicing.canGenerateFalseTripInvoice;

  const upsertEligibility = canUpsertTripRevenueSplit(trip);

  const { data: revenueSplit } = useTripRevenueSplit(trip.id, {
    enabled:
      !isSinCfdiEfectivo &&
      canReadTrip &&
      !isFalseTripOutcome &&
      (trip.invoicing.hasActiveSplit ||
        trip.invoicing.canGenerateInvoice ||
        trip.invoicing.splitLegsTotal > 0),
  });

  const hasDraftSplit = revenueSplit?.status === "draft";
  const activeSplitLegs =
    revenueSplit?.status === "active" ? revenueSplit.legs : [];
  const pendingSplitLegs = activeSplitLegs.filter((leg) => !leg.invoiceId);
  const invoicedSplitLegs = activeSplitLegs.filter((leg) => !!leg.invoiceId);

  const canShowSplitShareInvoiceAction =
    !isSinCfdiEfectivo &&
    !isTripCancelled &&
    canCreateInvoices &&
    trip.invoicing.canGenerateSplitShareInvoice &&
    !isFalseTripOutcome &&
    pendingSplitLegs.length > 0;
  const canViewSplitInvoices =
    !isSinCfdiEfectivo &&
    (canReadInvoices || canCreateInvoices) &&
    invoicedSplitLegs.length > 0;
  const canShowSplitMenuGroup =
    canShowSplitShareInvoiceAction || canViewSplitInvoices;

  const canShowRevenueSplitEntry =
    !isSinCfdiEfectivo &&
    !isFalseTripOutcome &&
    canReadTrip &&
    (trip.invoicing.hasActiveSplit ||
      hasDraftSplit ||
      (!isTripCancelled &&
        (upsertEligibility.allowed || upsertEligibility.blockReason != null)));

  const revenueSplitMenuLabel = trip.invoicing.hasActiveSplit
    ? copy.viewRevenueSplitMenu
    : hasDraftSplit
      ? copy.continueRevenueSplit
      : copy.openRevenueSplit;

  const revenueSplitMenuDisabled =
    !onOpenRevenueSplit ||
    (!trip.invoicing.hasActiveSplit &&
      !hasDraftSplit &&
      !upsertEligibility.allowed);

  const canShowAccessoryInvoiceAction =
    !isSinCfdiEfectivo &&
    !isTripCancelled &&
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
    accessoryInvoices.length > 0 ||
    canViewSplitInvoices;

  // Usar CTAs efectivos (no solo flags API): cancelled hard-gatea creates
  // pero debe seguir mostrando ver factura / reparto.
  const canShowLinkedInvoiceState =
    !canShowCreateInvoiceAction &&
    !canShowFalseTripInvoiceAction &&
    (hasInvoiceEvidence ||
      canShowAccessoryInvoiceAction ||
      canShowSplitMenuGroup) &&
    (canViewLinkedInvoice ||
      canCreateInvoices ||
      canShowAccessoryInvoiceAction ||
      canShowSplitMenuGroup);

  if (
    !canShowCreateInvoiceAction &&
    !canShowFalseTripInvoiceAction &&
    !canShowLinkedInvoiceState &&
    !canShowAccessoryInvoiceAction &&
    !canShowSplitShareInvoiceAction &&
    !canShowRevenueSplitEntry
  ) {
    return null;
  }

  const createPrimaryHref = `/invoices/new?trip_id=${trip.id}`;
  const createFalseTripHref = `/invoices/new?trip_id=${trip.id}&scope=false_trip`;
  const createAccessoryHref = `/invoices/new?trip_id=${trip.id}&scope=accessory`;

  const tripInvoicingConfig = getTripInvoicingBadgeConfig({
    status: trip.status,
    invoicing: trip.invoicing,
    cfdiEmissionIntent: trip.cfdiEmissionIntent,
  });

  const revenueSplitMenuItem =
    canShowRevenueSplitEntry && (canUpdateTrip || trip.invoicing.hasActiveSplit) ? (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={revenueSplitMenuDisabled}
          title={
            revenueSplitMenuDisabled
              ? (upsertEligibility.blockReason ?? undefined)
              : undefined
          }
          onSelect={() => {
            setTimeout(() => onOpenRevenueSplit?.(), 0);
          }}
        >
          <Users className="mr-2 h-4 w-4" />
          {revenueSplitMenuLabel}
        </DropdownMenuItem>
      </>
    ) : null;

  const splitMenuItems = canShowSplitMenuGroup ? (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
        {copy.splitMenuGroup}
      </DropdownMenuLabel>
      {canViewSplitInvoices
        ? invoicedSplitLegs.map((leg) => (
            <DropdownMenuItem
              key={`view-${leg.id}`}
              onSelect={() => navigate(`/invoices/${leg.invoiceId}`)}
            >
              <FileText className="mr-2 h-4 w-4" />
              {copy.viewSplitShare(legLabel(leg))}
            </DropdownMenuItem>
          ))
        : null}
      {canShowSplitShareInvoiceAction
        ? pendingSplitLegs.map((leg) => {
            const label = legLabel(leg);
            const attach =
              leg.suggestedCartaPorte && !trip.invoicing.cartaPorteAttached;
            return (
              <DropdownMenuItem
                key={`create-${leg.id}`}
                onSelect={() =>
                  navigate(splitInvoiceHref(trip.id, leg.id, attach))
                }
              >
                <Receipt className="mr-2 h-4 w-4" />
                {copy.generateSplitShare(label)}
              </DropdownMenuItem>
            );
          })
        : null}
      {trip.invoicing.hasActiveSplit ? (
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {copy.collectionByReceiverHint}
        </DropdownMenuLabel>
      ) : null}
    </>
  ) : null;

  const accessoryMenuItems =
    canViewAccessories || canShowAccessoryInvoiceAction ? (
      <>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {copy.accessoryMenuGroup}
        </DropdownMenuLabel>
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
      </>
    ) : null;

  if (presentation === "headerMenu") {
    const showMenuHeader =
      trip.invoicing.hasActiveSplit ||
      canShowLinkedInvoiceState ||
      canShowSplitMenuGroup ||
      canShowAccessoryInvoiceAction ||
      canShowCreateInvoiceAction ||
      canShowFalseTripInvoiceAction;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Receipt className="h-4 w-4 shrink-0" />
            <span className="mx-1.5">{copy.menuLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          {showMenuHeader ? (
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={tripInvoicingConfig.variant}>
                    {toDetailInvoicingBadge(tripInvoicingConfig).label}
                  </Badge>
                  {trip.invoicing.hasActiveSplit ? (
                    <span className="text-xs text-muted-foreground">
                      {copy.splitProgress(
                        trip.invoicing.splitLegsInvoiced,
                        trip.invoicing.splitLegsTotal,
                      )}
                    </span>
                  ) : trip.invoicing.invoiceFolio ? (
                    <span className="text-xs text-muted-foreground">
                      Folio {trip.invoicing.invoiceFolio}
                    </span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
          ) : null}

          {canShowCreateInvoiceAction ? (
            <>
              {showMenuHeader ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem onSelect={() => navigate(createPrimaryHref)}>
                <Receipt className="mr-2 h-4 w-4" />
                {copy.generatePrimary}
              </DropdownMenuItem>
            </>
          ) : null}

          {canShowFalseTripInvoiceAction && !canShowCreateInvoiceAction ? (
            <>
              {showMenuHeader ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem onSelect={() => navigate(createFalseTripHref)}>
                <Receipt className="mr-2 h-4 w-4" />
                {copy.generateFalseTrip}
              </DropdownMenuItem>
            </>
          ) : null}

          {revenueSplitMenuItem}

          {canViewLinkedInvoice ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => navigate(`/invoices/${trip.invoicing.invoiceId}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                {copy.viewPrimary}
              </DropdownMenuItem>
            </>
          ) : null}

          {splitMenuItems}
          {accessoryMenuItems}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (canShowCreateInvoiceAction || canShowFalseTripInvoiceAction) {
    const createHref = canShowFalseTripInvoiceAction
      ? createFalseTripHref
      : createPrimaryHref;
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
        <Button variant="outline" onClick={() => navigate(createHref)}>
          <Receipt className="h-4 w-4 mr-2" />
          {canShowFalseTripInvoiceAction
            ? copy.generateFalseTrip
            : copy.generatePrimary}
        </Button>
        {canShowRevenueSplitEntry && onOpenRevenueSplit ? (
          <Button variant="outline" onClick={onOpenRevenueSplit}>
            <Users className="h-4 w-4 mr-2" />
            {revenueSplitMenuLabel}
          </Button>
        ) : null}
      </div>
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
        {canShowSplitShareInvoiceAction
          ? pendingSplitLegs.map((leg) => {
              const label = legLabel(leg);
              const attach =
                leg.suggestedCartaPorte && !trip.invoicing.cartaPorteAttached;
              return (
                <Button
                  key={leg.id}
                  variant="outline"
                  onClick={() =>
                    navigate(splitInvoiceHref(trip.id, leg.id, attach))
                  }
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {copy.generateSplitShare(label)}
                </Button>
              );
            })
          : null}
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
