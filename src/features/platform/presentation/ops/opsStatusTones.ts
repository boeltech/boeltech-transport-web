import {
  AdminActivationStatus,
  PlatformTenantStatus,
  type AdminActivationStatusType,
  type PlatformLifecycleStageType,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import type { OpsBadgeTone } from "./ui/OpsBadge";
import type { OpsLifecycleSealTone } from "./ui/OpsLifecycleSeal";
import {
  resolvePlatformHealthTone,
  type PlatformHealthTone,
} from "../utils/platformHealthTone";

export function accessStatusTone(
  status: PlatformTenantStatusType,
): OpsBadgeTone {
  if (status === PlatformTenantStatus.SUSPENDED) return "danger";
  if (status === PlatformTenantStatus.CANCELLED) return "muted";
  return "ok";
}

export function subscriptionStatusTone(status: string | null): OpsBadgeTone {
  if (!status) return "muted";
  if (status === "past_due") return "warn";
  if (status === "trialing") return "accent";
  if (status === "active") return "ok";
  if (status === "paused" || status === "canceled") return "warn";
  return "muted";
}

export function lifecycleStageTone(
  stage: PlatformLifecycleStageType,
): OpsBadgeTone {
  switch (stage) {
    case "active":
      return "ok";
    case "suspended":
      return "danger";
    case "at_risk":
    case "onboarding":
      return "warn";
    case "trialing":
    case "provisioning":
      return "accent";
    default:
      return "muted";
  }
}

/**
 * Un tick en la fila de empresas. Suspensión gana; past_due es atención.
 */
export function tenantListTick(tenant: {
  status: PlatformTenantStatusType;
  lifecycleStage: PlatformLifecycleStageType;
  subscriptionStatus: string | null;
}): "warn" | "danger" | undefined {
  if (tenant.status === PlatformTenantStatus.SUSPENDED) return "danger";
  const seal = lifecycleStageSealTone(tenant.lifecycleStage);
  if (seal === "danger") return "danger";
  if (seal === "warn" || tenant.subscriptionStatus === "past_due") return "warn";
  return undefined;
}

/** Sello de etapa. Trial es tinta; at_risk es atención, no suspensión. */
export function lifecycleStageSealTone(
  stage: PlatformLifecycleStageType,
): OpsLifecycleSealTone {
  switch (stage) {
    case "active":
      return "ok";
    case "suspended":
      return "danger";
    case "at_risk":
    case "onboarding":
      return "warn";
    case "trialing":
    case "provisioning":
      return "trial";
    default:
      return "muted";
  }
}

export function activationStatusTone(
  status: AdminActivationStatusType,
): OpsBadgeTone {
  switch (status) {
    case AdminActivationStatus.ACTIVATED:
      return "ok";
    case AdminActivationStatus.PENDING:
      return "warn";
    case AdminActivationStatus.EMAIL_FAILED:
    case AdminActivationStatus.EXPIRED:
      return "danger";
    default:
      return "muted";
  }
}

export function healthToneToOps(tone: PlatformHealthTone): OpsBadgeTone {
  switch (tone) {
    case "healthy":
      return "ok";
    case "watch":
      return "warn";
    case "risk":
      return "danger";
    default:
      return "muted";
  }
}

export function healthScoreTone(
  score: number | null | undefined,
): OpsBadgeTone {
  return healthToneToOps(resolvePlatformHealthTone(score));
}
