/**
 * Badge de Factura del viaje con las acciones de gobierno (D1–D7, D13).
 * La etiqueta Solicitar / Usar sale de la política y la regla cuando el rol
 * puede leerlas; si no, aplica y abre solicitud ante 422.
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@features/auth/application";
import { useApprovalPolicies } from "@features/approval-policies/application";
import {
  useApproveApprovable,
  useRejectApprovable,
} from "@features/approvals/application";
import { useFiscalPolicy } from "@features/settings/application";
import { isAdminRole, usePermissions, useRole } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  tripQueryKeys,
  type Trip,
  type TripSettlementException,
} from "@features/trips/domain";
import { useUpdateTrip } from "../../application";
import { tripsApi } from "../../infrastructure/api/tripsApi";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import {
  TripLiquidacionChip,
  type TripLiquidacionIntentActions,
} from "./TripLiquidacionChip";
import {
  actorCanCancelRequest,
  buildTripLiquidacionGovernance,
  tierRequiresApproval,
} from "../utils/sinCfdiGovernance";

const g = cfdiEmissionIntentCopy.governance;

function errorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : g.error;
}

export function TripLiquidacionControl({
  trip,
  isLeanTripPortal = false,
}: {
  trip: Trip;
  isLeanTripPortal?: boolean;
}) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const role = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateTrip = useUpdateTrip();
  const approve = useApproveApprovable();
  const reject = useRejectApprovable();
  const [error, setError] = useState<string | null>(null);

  const canReadPolicy = hasPermission("fiscal_policy", "read");
  const canReadRules = hasPermission("approval_policies", "read");
  const policy = useFiscalPolicy({ enabled: canReadPolicy });
  const rulesEnabled =
    canReadRules &&
    canReadPolicy &&
    policy.data != null &&
    policy.data.sinCfdiMode !== "disabled";
  const rules = useApprovalPolicies({ enabled: rulesEnabled });

  const waiting =
    (canReadPolicy && policy.isLoading) || (rulesEnabled && rules.isLoading);

  const concept = rules.data?.concepts.find(
    (item) => item.concept === "sin_cfdi_exception",
  );
  const governance = waiting
    ? null
    : buildTripLiquidacionGovernance({
        trip,
        canRequest: hasPermission("trips_settlement", "request"),
        canRegularize: hasPermission("trips_settlement", "update"),
        canApprove: hasPermission("trips_settlement", "approve"),
        canCancel: actorCanCancelRequest(
          trip.settlementException,
          user?.id ?? null,
          isAdminRole(role),
        ),
        canReadApprovals: hasPermission("finance_approvals", "read"),
        isLeanTripPortal,
        mode: policy.data?.sinCfdiMode ?? null,
        requiresApproval: rulesEnabled
          ? tierRequiresApproval(
              concept?.rules.tiers,
              trip.costs.baseRate,
            )
          : null,
      });

  async function refreshTrip() {
    await queryClient.invalidateQueries({
      queryKey: tripQueryKeys.detail(trip.id),
    });
  }

  function outcomeToast(exception: TripSettlementException | null | undefined) {
    const applied = exception?.status === "approved";
    toast({
      title: applied ? g.applied : g.requested,
      variant: "success",
    });
  }

  const actions: TripLiquidacionIntentActions = {
    pending:
      updateTrip.isPending || approve.isPending || reject.isPending,
    error,
    clearError: () => setError(null),
    onApply: async (reason) => {
      try {
        await updateTrip.mutateAsync({
          id: trip.id,
          data: { cfdiEmissionIntent: "sin_cfdi_efectivo", reason },
        });
        toast({ title: g.applied, variant: "success" });
        return true;
      } catch (caught) {
        if (errorCode(caught) === "SIN_CFDI_EXCEPTION_REQUIRED") {
          try {
            const exception = await tripsApi.requestSinCfdiException(trip.id, {
              reason,
            });
            await refreshTrip();
            outcomeToast(exception);
            return true;
          } catch (requestError) {
            setError(errorMessage(requestError));
            return false;
          }
        }
        setError(errorMessage(caught));
        return false;
      }
    },
    onRequest: async (reason) => {
      try {
        const exception = await tripsApi.requestSinCfdiException(trip.id, {
          reason,
        });
        await refreshTrip();
        outcomeToast(exception);
        return true;
      } catch (caught) {
        setError(errorMessage(caught));
        return false;
      }
    },
    onRegularize: async (reason) => {
      try {
        await tripsApi.regularizeSinCfdi(trip.id, { reason });
        await refreshTrip();
        toast({ title: g.regularized, variant: "success" });
        return true;
      } catch (caught) {
        setError(errorMessage(caught));
        return false;
      }
    },
    onCancel: async (reason) => {
      const request = trip.settlementException;
      if (!request) return false;
      try {
        await tripsApi.cancelSinCfdiException(trip.id, request.id, { reason });
        await refreshTrip();
        toast({ title: g.cancelled, variant: "success" });
        return true;
      } catch (caught) {
        setError(errorMessage(caught));
        return false;
      }
    },
    onApprove: async () => {
      const request = trip.settlementException;
      if (!request) return false;
      try {
        await approve.mutateAsync({
          type: "sin_cfdi_exception",
          id: request.id,
          guards:
            request.approval?.stepCurrent != null
              ? { expectedStep: request.approval.stepCurrent }
              : undefined,
        });
        await refreshTrip();
        toast({ title: g.approved, variant: "success" });
        return true;
      } catch (caught) {
        setError(errorMessage(caught));
        return false;
      }
    },
    onReject: async (reason) => {
      const request = trip.settlementException;
      if (!request) return false;
      try {
        await reject.mutateAsync({
          type: "sin_cfdi_exception",
          id: request.id,
          reason,
          guards:
            request.approval?.stepCurrent != null
              ? { expectedStep: request.approval.stepCurrent }
              : undefined,
        });
        await refreshTrip();
        toast({ title: g.rejected, variant: "success" });
        return true;
      } catch (caught) {
        setError(errorMessage(caught));
        return false;
      }
    },
  };

  return (
    <TripLiquidacionChip
      trip={trip}
      governance={governance}
      actions={actions}
    />
  );
}
