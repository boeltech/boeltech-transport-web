import {
  AdminActivationStatus,
  PlatformSubscriptionStatus,
  PlatformTenantStatus,
  type AdminActivationStatusType,
  type PlatformTenantStatusType,
} from "../../domain/entities";

export type HubPrimaryKind =
  | "continue_onboarding"
  | "resend_activation"
  | "register_payment"
  | "reactivate"
  | null;

const ACTIVATION_ACTIONABLE: ReadonlySet<AdminActivationStatusType> = new Set([
  AdminActivationStatus.PENDING,
  AdminActivationStatus.EMAIL_FAILED,
  AdminActivationStatus.EXPIRED,
]);

/**
 * Primaria del hub. Una sola, y solo si se puede mutar.
 * El cobro pendiente gana aunque el acceso esté suspendido.
 * Cambiar plan no es sólido.
 */
export function resolveHubPrimaryKind(input: {
  canMutate: boolean;
  accessStatus: PlatformTenantStatusType;
  subscriptionStatus: string | null;
  activationStatus: AdminActivationStatusType;
  hasOpenInvoices: boolean;
  lifecycleStage?: string | null;
}): HubPrimaryKind {
  if (!input.canMutate) return null;

  if (
    input.accessStatus === PlatformTenantStatus.CANCELLED ||
    input.subscriptionStatus === PlatformSubscriptionStatus.CANCELED
  ) {
    return null;
  }

  if (
    input.subscriptionStatus === PlatformSubscriptionStatus.PAST_DUE ||
    input.hasOpenInvoices
  ) {
    return "register_payment";
  }

  if (input.accessStatus === PlatformTenantStatus.SUSPENDED) {
    return "reactivate";
  }

  if (ACTIVATION_ACTIONABLE.has(input.activationStatus)) {
    return "resend_activation";
  }

  if (
    input.lifecycleStage === "prospect" ||
    input.lifecycleStage === "provisioning"
  ) {
    return "continue_onboarding";
  }

  return null;
}
