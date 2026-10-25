/**
 * Scopes de create elegibles desde el detalle de viaje (pedido claridad flujo · F3).
 * Misma verdad efectiva que el menú de `TripInvoiceActions` — no inventa scopes.
 * Skip rules (TEC §C / D2): 0 → none; 1 scope + 1 destino → navigate; split N>1 → sheet
 * solo porciones; >1 scopes → sheet completo.
 */

import { buildInvoiceCreateHref } from "@features/invoicing/application/invoiceCreateHref";
import { TripStatus, type TripStatusType } from "@features/trips/domain";

export type TripInvoiceScopeKind =
  | "primary_transport"
  | "false_trip"
  | "accessory"
  | "split_share";

export type TripInvoiceScopeDestination = {
  readonly href: string;
  readonly legId?: string;
  readonly legLabel?: string;
};

export type EligibleTripInvoiceScope = {
  readonly kind: TripInvoiceScopeKind;
  readonly destinations: readonly TripInvoiceScopeDestination[];
};

export type PendingSplitLegForScope = {
  readonly id: string;
  readonly clientId: string;
  readonly clientLegalName: string | null;
  readonly clientRfc: string | null;
  readonly suggestedCartaPorte: boolean;
  readonly invoiceId: string | null;
};

export type ListEligibleTripInvoiceScopesInput = {
  readonly tripId: string;
  readonly status: TripStatusType;
  readonly operationalOutcome: string | null | undefined;
  readonly cfdiEmissionIntent: string | null | undefined;
  readonly canCreateInvoices: boolean;
  readonly canGenerateInvoice: boolean;
  readonly canGenerateFalseTripInvoice: boolean;
  readonly canGenerateAccessoryInvoice: boolean;
  readonly canGenerateSplitShareInvoice: boolean;
  readonly hasActiveSplit: boolean;
  readonly cartaPorteAttached: boolean;
  readonly pendingSplitLegs: readonly PendingSplitLegForScope[];
};

export type TripInvoiceScopeDecision =
  | { readonly kind: "none" }
  | { readonly kind: "navigate"; readonly href: string }
  | {
      readonly kind: "open_sheet";
      readonly scopes: readonly EligibleTripInvoiceScope[];
      /** full = varios tipos; split_legs = un solo scope split con N porciones. */
      readonly variant: "full" | "split_legs";
    };

function legLabel(leg: PendingSplitLegForScope): string {
  return leg.clientLegalName || leg.clientRfc || leg.clientId.slice(0, 8);
}

/**
 * Lista scopes con CTA create verdadero (misma defensa local que el menú).
 */
export function listEligibleTripInvoiceScopes(
  input: ListEligibleTripInvoiceScopesInput,
): EligibleTripInvoiceScope[] {
  const isSinCfdiEfectivo = input.cfdiEmissionIntent === "sin_cfdi_efectivo";
  const isTripCancelled = input.status === TripStatus.CANCELLED;
  const isFalseTripOutcome = input.operationalOutcome === "false_trip";

  if (isSinCfdiEfectivo || isTripCancelled || !input.canCreateInvoices) {
    return [];
  }

  const scopes: EligibleTripInvoiceScope[] = [];

  const canShowCreateInvoiceAction =
    input.canGenerateInvoice &&
    !isFalseTripOutcome &&
    !input.hasActiveSplit;

  const canShowFalseTripInvoiceAction = input.canGenerateFalseTripInvoice;

  // Paridad menú: falso solo como create tipado cuando no hay flete create.
  if (canShowCreateInvoiceAction) {
    scopes.push({
      kind: "primary_transport",
      destinations: [
        { href: buildInvoiceCreateHref({ tripId: input.tripId }) },
      ],
    });
  } else if (canShowFalseTripInvoiceAction) {
    scopes.push({
      kind: "false_trip",
      destinations: [
        {
          href: buildInvoiceCreateHref({
            tripId: input.tripId,
            scope: "false_trip",
          }),
        },
      ],
    });
  }

  const canShowSplitShareInvoiceAction =
    input.canGenerateSplitShareInvoice &&
    !isFalseTripOutcome &&
    input.pendingSplitLegs.length > 0;

  if (canShowSplitShareInvoiceAction) {
    scopes.push({
      kind: "split_share",
      destinations: input.pendingSplitLegs.map((leg) => {
        const attach =
          leg.suggestedCartaPorte && !input.cartaPorteAttached;
        return {
          href: buildInvoiceCreateHref({
            tripId: input.tripId,
            scope: "split_share",
            legId: leg.id,
            attachCartaPorte: attach,
          }),
          legId: leg.id,
          legLabel: legLabel(leg),
        };
      }),
    });
  }

  const canShowAccessoryInvoiceAction =
    input.canGenerateAccessoryInvoice && !isFalseTripOutcome;

  if (canShowAccessoryInvoiceAction) {
    scopes.push({
      kind: "accessory",
      destinations: [
        {
          href: buildInvoiceCreateHref({
            tripId: input.tripId,
            scope: "accessory",
          }),
        },
      ],
    });
  }

  return scopes;
}

/**
 * Freight-family scopes that may elevate next-step «Facturar» (D10) and the
 * header primary CTA (D14). Accessory-only does **not** count — create
 * accesoria stays in the typed Facturación menu item.
 */
export function hasFreightFamilyTripInvoiceScope(
  scopes: readonly EligibleTripInvoiceScope[],
): boolean {
  return scopes.some(
    (scope) =>
      scope.kind === "primary_transport" ||
      scope.kind === "false_trip" ||
      scope.kind === "split_share",
  );
}

/** Aplica skip rules D2 / TEC §C sobre la lista de scopes elegibles. */
export function resolveTripInvoiceScopeDecision(
  scopes: readonly EligibleTripInvoiceScope[],
): TripInvoiceScopeDecision {
  if (scopes.length === 0) {
    return { kind: "none" };
  }

  if (scopes.length === 1) {
    const sole = scopes[0]!;
    if (sole.destinations.length === 1) {
      return { kind: "navigate", href: sole.destinations[0]!.href };
    }
    if (sole.kind === "split_share" && sole.destinations.length > 1) {
      return { kind: "open_sheet", scopes, variant: "split_legs" };
    }
    // Defensa: scope sin destinos → no Facturar create.
    if (sole.destinations.length === 0) {
      return { kind: "none" };
    }
    return { kind: "open_sheet", scopes, variant: "full" };
  }

  return { kind: "open_sheet", scopes, variant: "full" };
}
