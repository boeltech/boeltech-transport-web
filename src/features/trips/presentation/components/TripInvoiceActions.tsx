/**
 * TripInvoiceActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Encapsula la lógica visual de "Facturación" en el header del detalle de viaje.
 *
 * ADR-0068: servicios adicionales · ADR-0079: viaje en falso · ADR-0081: reparto del flete.
 * F3: primaria Facturar → decision sheet o skip (D2); menú tipado = atajo.
 * F7 / D14: elevación freight-family (inline / menú tipado).
 * F11a / D24: sin CTA verde «Facturar» en headerMenu.
 * D5 / D-HF1…7: headerMenu = ≤1 Facturar outline; overflow fiscal → Más / tab.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Receipt, Users } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { usePermissions } from "@shared/permissions";
import { TripStatus, type Trip } from "@features/trips/domain";
import { getTripInvoicingBadgeConfig } from "@features/trips";
import { useTripRevenueSplit } from "@features/trips/application";
import { tripFiscalCopy } from "../copy/tripFiscalCopy";
import {
  hasFreightFamilyTripInvoiceScope,
  listEligibleTripInvoiceScopes,
  resolveTripInvoiceScopeDecision,
} from "../helpers/listEligibleTripInvoiceScopes";
import { canUpsertTripRevenueSplit } from "./trip-fiscal/tripFiscalHelpers";
import { TripInvoiceScopeDecisionSheet } from "./TripInvoiceScopeDecisionSheet";

const copy = tripFiscalCopy.invoiceActions;

export interface TripInvoiceActionsProps {
  trip: Trip;
  className?: string;
  presentation?: "inline" | "headerMenu";
  onOpenRevenueSplit?: () => void;
  /**
   * Control externo del sheet (p. ej. next-step Facturar en detalle).
   * Si se omite, el sheet es interno al componente.
   */
  scopeSheetOpen?: boolean;
  onScopeSheetOpenChange?: (open: boolean) => void;
}

export function TripInvoiceActions({
  trip,
  className,
  presentation = "inline",
  onOpenRevenueSplit,
  scopeSheetOpen: scopeSheetOpenControlled,
  onScopeSheetOpenChange,
}: TripInvoiceActionsProps) {
  const navigate = useNavigate();
  const goToInvoice = (href: string) =>
    navigate(href, { state: { from: `/trips/${trip.id}` } });
  const { hasPermission } = usePermissions();

  const [internalSheetOpen, setInternalSheetOpen] = useState(false);
  const sheetOpen = scopeSheetOpenControlled ?? internalSheetOpen;
  const setSheetOpen = onScopeSheetOpenChange ?? setInternalSheetOpen;

  const canCreateInvoices = hasPermission("invoices", "create");
  const canReadInvoices = hasPermission("invoices", "read");
  const canUpdateTrip = hasPermission("trips", "update");
  const canExecuteTrip = hasPermission("trips", "execute");
  const canReadTrip = hasPermission("trips", "read");
  const canOperatePatio = canUpdateTrip || canExecuteTrip;

  const canViewLinkedInvoice =
    (canReadInvoices || canCreateInvoices) && !!trip.invoicing.invoiceId;

  const isFalseTripOutcome = trip.operationalOutcome === "false_trip";
  /** ADR-0096: sin ciclo CFDI — ocultar Facturar / false_trip / split / accesorio. */
  const isSinCfdiEfectivo = trip.cfdiEmissionIntent === "sin_cfdi_efectivo";
  /** Defensa local: viaje cancelado no ofrece CTAs de create (no solo flags API). */
  const isTripCancelled = trip.status === TripStatus.CANCELLED;

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
  const pendingSplitLegs = useMemo(() => {
    if (revenueSplit?.status !== "active") return [];
    return revenueSplit.legs.filter((leg) => !leg.invoiceId);
  }, [revenueSplit]);
  const invoicedSplitLegs = useMemo(() => {
    if (revenueSplit?.status !== "active") return [];
    return revenueSplit.legs.filter((leg) => !!leg.invoiceId);
  }, [revenueSplit]);

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

  const canShowPendingAccountantHint =
    !canCreateInvoices &&
    !isSinCfdiEfectivo &&
    !isTripCancelled &&
    (trip.invoicing.canGenerateInvoice ||
      trip.invoicing.canGenerateFalseTripInvoice ||
      trip.invoicing.canGenerateSplitShareInvoice);

  const canShowAccessoryInvoiceAction =
    !isSinCfdiEfectivo &&
    !isTripCancelled &&
    canCreateInvoices &&
    trip.invoicing.canGenerateAccessoryInvoice &&
    !isFalseTripOutcome;

  const accessoryInvoices = trip.invoicing.accessoryInvoices ?? [];

  const eligibleScopes = useMemo(
    () =>
      listEligibleTripInvoiceScopes({
        tripId: trip.id,
        status: trip.status,
        operationalOutcome: trip.operationalOutcome,
        cfdiEmissionIntent: trip.cfdiEmissionIntent,
        canCreateInvoices,
        canGenerateInvoice: trip.invoicing.canGenerateInvoice,
        canGenerateFalseTripInvoice: trip.invoicing.canGenerateFalseTripInvoice,
        canGenerateAccessoryInvoice: trip.invoicing.canGenerateAccessoryInvoice,
        canGenerateSplitShareInvoice:
          trip.invoicing.canGenerateSplitShareInvoice,
        hasActiveSplit: trip.invoicing.hasActiveSplit,
        cartaPorteAttached: trip.invoicing.cartaPorteAttached,
        pendingSplitLegs,
      }),
    [
      trip.id,
      trip.status,
      trip.operationalOutcome,
      trip.cfdiEmissionIntent,
      canCreateInvoices,
      trip.invoicing.canGenerateInvoice,
      trip.invoicing.canGenerateFalseTripInvoice,
      trip.invoicing.canGenerateAccessoryInvoice,
      trip.invoicing.canGenerateSplitShareInvoice,
      trip.invoicing.hasActiveSplit,
      trip.invoicing.cartaPorteAttached,
      pendingSplitLegs,
    ],
  );

  const createDecision = useMemo(
    () => resolveTripInvoiceScopeDecision(eligibleScopes),
    [eligibleScopes],
  );

  const sheetVariant =
    createDecision.kind === "open_sheet" ? createDecision.variant : "full";

  const handlePrimaryFacturar = () => {
    if (createDecision.kind === "navigate") {
      goToInvoice(createDecision.href);
      return;
    }
    if (createDecision.kind === "open_sheet") {
      setSheetOpen(true);
    }
  };

  const hasInvoiceEvidence =
    !!trip.invoicing.invoiceId ||
    !!trip.invoicing.invoiceFolio ||
    trip.invoicing.invoiceStatus !== null ||
    accessoryInvoices.length > 0 ||
    canViewSplitInvoices;

  // Freight-family create: eleva Facturar en inline; en headerMenu solo menú (D24).
  // Solo accessory → menú tipado sin primario elevado.
  const showPrimaryFacturar =
    createDecision.kind !== "none" &&
    hasFreightFamilyTripInvoiceScope(eligibleScopes);

  // Usar CTAs efectivos (no solo flags API): cancelled hard-gatea creates
  // pero debe seguir mostrando ver factura / reparto / create accesoria.
  // `!showPrimaryFacturar` (no `kind === "none"`): accessory-only aún es create
  // pero no eleva el primario (inline outline / header ya sin CTA verde).
  const canShowLinkedInvoiceState =
    !showPrimaryFacturar &&
    (hasInvoiceEvidence ||
      canShowAccessoryInvoiceAction ||
      canShowSplitMenuGroup) &&
    (canViewLinkedInvoice ||
      canCreateInvoices ||
      canShowAccessoryInvoiceAction ||
      canShowSplitMenuGroup);

  if (
    !showPrimaryFacturar &&
    !canShowLinkedInvoiceState &&
    !canShowRevenueSplitEntry &&
    !canShowPendingAccountantHint
  ) {
    return null;
  }

  const tripInvoicingConfig = getTripInvoicingBadgeConfig({
    status: trip.status,
    invoicing: trip.invoicing,
    cfdiEmissionIntent: trip.cfdiEmissionIntent,
  });

  const showPatioEscalateHint = !canOperatePatio && hasDraftSplit;

  const scopeSheet = (
    <TripInvoiceScopeDecisionSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      scopes={eligibleScopes}
      variant={sheetVariant}
      onSelectHref={goToInvoice}
    />
  );

  const pendingAccountantBadge = canShowPendingAccountantHint ? (
    <Badge
      variant="warning"
      tone="soft"
      title={copy.pendingAccountantHint}
    >
      {copy.pendingAccountant}
    </Badge>
  ) : null;

  if (presentation === "headerMenu") {
    // D5 / D-HF1: solo Facturar outline (+ badge contador). Cero Select hermano.
    // Overflow fiscal (reparto / ver / accesorias / porciones) → Más / tab Facturación.
    // D19/D28: split activo o borrador → sin Facturar en header.
    const showHeaderFacturar =
      showPrimaryFacturar &&
      !hasDraftSplit &&
      !trip.invoicing.hasActiveSplit;

    if (!showHeaderFacturar && !pendingAccountantBadge) {
      // Conservar sheet controlado (Qué sigue / next-step Facturar).
      return scopeSheet;
    }

    return (
      <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
        {pendingAccountantBadge}
        {showHeaderFacturar ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrimaryFacturar}
            data-testid="trip-header-facturar"
          >
            <Receipt className="mr-1.5 h-4 w-4" />
            {copy.generatePrimary}
          </Button>
        ) : null}
        {scopeSheet}
      </div>
    );
  }

  if (showPrimaryFacturar) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
        <Button variant="outline" onClick={handlePrimaryFacturar}>
          <Receipt className="h-4 w-4 mr-2" />
          {copy.generatePrimary}
        </Button>
        {canShowRevenueSplitEntry && onOpenRevenueSplit && canOperatePatio ? (
          <Button variant="outline" onClick={onOpenRevenueSplit}>
            <Users className="h-4 w-4 mr-2" />
            {revenueSplitMenuLabel}
          </Button>
        ) : null}
        {showPatioEscalateHint ? (
          <p className="text-xs text-muted-foreground max-w-xs">
            {copy.patioEscalateHint}
          </p>
        ) : null}
        {scopeSheet}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="rounded-md border px-3 py-2">
          <div className="flex items-center gap-2">
            {canShowPendingAccountantHint ? (
              <Badge
                variant="warning"
                tone="soft"
                title={copy.pendingAccountantHint}
              >
                {copy.pendingAccountant}
              </Badge>
            ) : (
              <Badge variant={tripInvoicingConfig.variant}>
                {tripInvoicingConfig.label}
              </Badge>
            )}
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
            onClick={() => goToInvoice(`/invoices/${trip.invoicing.invoiceId}`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            {copy.viewPrimary}
          </Button>
        ) : null}
      </div>
      {scopeSheet}
    </div>
  );
}

export default TripInvoiceActions;
