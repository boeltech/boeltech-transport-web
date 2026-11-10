/**
 * Qué CTA de Sin factura corresponde al modo, la regla y el perfil del cliente.
 * Quien no puede leer política ni reglas ve «aplicar»; un 422 abre la solicitud.
 */
import {
  canRegularizeSinCfdiTrip,
  SIN_CFDI_REGULARIZE_LOCKED_CASH_CODE,
  type SinCfdiMode,
} from "@boeltech/cfdi-domain";
import {
  hasOperationalCashCollected,
  type Trip,
  type TripSettlementException,
} from "@features/trips/domain";
import { canEditTripLiquidacionIntent } from "./tripLiquidacionMutability";
import type { TripLiquidacionGovernance } from "../components/TripLiquidacionChip";

export type SinCfdiChangeKind = "apply" | "request" | "blocked";

export function tierRequiresApproval(
  tiers:
    | readonly { minAmount: number; requiresApproval: boolean }[]
    | null
    | undefined,
  amount: number,
): boolean | null {
  if (!tiers || tiers.length === 0) return null;
  const eligible = tiers.filter((tier) => tier.minAmount <= amount);
  const pool = eligible.length > 0 ? eligible : [tiers[0]!];
  const tier = pool.reduce((best, current) =>
    current.minAmount >= best.minAmount ? current : best,
  );
  return tier.requiresApproval;
}

export function resolveSinCfdiChangeKind(input: {
  mode: SinCfdiMode | null;
  clientProfile: "receptor_cfdi" | "comercial_only" | null | undefined;
  /** null = la regla no se pudo leer. */
  requiresApproval: boolean | null;
}): SinCfdiChangeKind {
  if (input.mode === "disabled") return "blocked";
  if (input.clientProfile === "comercial_only") return "apply";
  if (input.requiresApproval === true) return "request";
  if (input.requiresApproval === false) return "apply";
  if (input.mode === "comercial_only_clients") return "request";
  return "apply";
}

export function buildTripLiquidacionGovernance(input: {
  trip: Trip;
  canRequest: boolean;
  canRegularize: boolean;
  canApprove: boolean;
  canCancel: boolean;
  canReadApprovals: boolean;
  isLeanTripPortal?: boolean;
  mode: SinCfdiMode | null;
  requiresApproval: boolean | null;
}): TripLiquidacionGovernance | null {
  if (input.isLeanTripPortal) return null;

  const openRequest =
    input.trip.settlementException?.status === "in_progress"
      ? input.trip.settlementException
      : null;
  const kind = resolveSinCfdiChangeKind({
    mode: input.mode,
    clientProfile: input.trip.client?.cfdiReceptorProfile,
    requiresApproval: input.requiresApproval,
  });
  const windowOpen = canEditTripLiquidacionIntent(input.trip, {
    canUpdateTrip: input.canRequest,
    isLeanTripPortal: false,
  });

  const profile = input.trip.client?.cfdiReceptorProfile;
  const cashCollected = hasOperationalCashCollected(input.trip);
  const regularizeInput = profile
    ? {
        status: input.trip.status,
        currentIntent: input.trip.cfdiEmissionIntent ?? "emitir_cfdi",
        nextIntent: "emitir_cfdi" as const,
        clientProfile: profile,
        allowCompleted: false as const,
      }
    : null;
  const regularizeBase = regularizeInput
    ? canRegularizeSinCfdiTrip({
        ...regularizeInput,
        hasOperationalCashCollected: false,
      })
    : null;
  const regularizeNow = regularizeInput
    ? canRegularizeSinCfdiTrip({
        ...regularizeInput,
        hasOperationalCashCollected: cashCollected,
      })
    : null;
  const cashLocked =
    input.canRegularize &&
    regularizeBase?.ok === true &&
    regularizeNow?.ok === false &&
    regularizeNow.error[0]?.code === SIN_CFDI_REGULARIZE_LOCKED_CASH_CODE;

  return {
    canOpenSinCfdi: windowOpen && kind !== "blocked" && openRequest == null,
    changeKind: kind === "request" ? "request" : "apply",
    canRegularize: input.canRegularize && regularizeNow?.ok === true,
    regularizeCashLocked: cashLocked,
    openRequest,
    canApprove: Boolean(openRequest && input.canApprove && openRequest.approval?.canAct),
    canCancel: Boolean(openRequest && input.canCancel),
    approvalsHref:
      openRequest && !openRequest.approval?.canAct && input.canReadApprovals
        ? "/finance/approvals?type=sin_cfdi_exception"
        : null,
  };
}

export function actorCanCancelRequest(
  request: TripSettlementException | null | undefined,
  actorUserId: string | null,
  isAdmin: boolean,
): boolean {
  if (!request || request.status !== "in_progress") return false;
  return isAdmin || (actorUserId != null && request.requestedBy === actorUserId);
}
