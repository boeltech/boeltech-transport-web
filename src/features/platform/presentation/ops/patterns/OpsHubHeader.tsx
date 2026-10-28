import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
  type PlatformLifecycleStageType,
  type PlatformTenantStatusType,
} from "../../../domain/entities";
import { getLifecycleStageLabel } from "../../config/platformLifecycleConfig";
import { opsCopy } from "../opsCopy";
import { lifecycleStageSealTone } from "../opsStatusTones";
import { OpsBadge, type OpsBadgeTone } from "../ui/OpsBadge";
import { OpsLifecycleSeal } from "../ui/OpsLifecycleSeal";
import { OpsPanel, OpsPanelBody } from "../ui/OpsPanel";
import { OpsPlanSeal } from "../ui/OpsPlanSeal";

export interface OpsHubHeaderProps {
  backHref?: string;
  backLabel?: string;
  tenantName: string;
  subdomain: string;
  tenantIdShort: string;
  accessStatus: PlatformTenantStatusType;
  lifecycleStage: PlatformLifecycleStageType;
  /** Código de plan. Si viene, el sello imprime el código y no el nombre. */
  planCode?: string | null;
  planName?: string | null;
  saasBanner?: string;
  trialEndsLabel?: string | null;
  pastDueLabel?: string | null;
  onViewCollections?: () => void;
  /** Cupo del caller: un sólido y hasta dos ghost. El header no inventa botones. */
  actions?: ReactNode;
}

function accessTone(status: PlatformTenantStatusType): OpsBadgeTone {
  if (status === PlatformTenantStatus.SUSPENDED) return "danger";
  if (status === PlatformTenantStatus.CANCELLED) return "muted";
  return "ok";
}

/**
 * Hub above-the-fold — un título, sellos plan → etapa → acceso, cupo del caller.
 */
export function OpsHubHeader({
  backHref = "/platform/tenants",
  backLabel = opsCopy.hub.back,
  tenantName,
  subdomain,
  tenantIdShort,
  accessStatus,
  lifecycleStage,
  planCode,
  planName,
  saasBanner = opsCopy.hub.saasBanner,
  trialEndsLabel = null,
  pastDueLabel = null,
  onViewCollections,
  actions,
}: OpsHubHeaderProps) {
  const planCodeText = planCode?.trim() ?? "";

  return (
    <div className="space-y-3" data-testid="ops-hub-header">
      <div className="flex flex-wrap items-center gap-2 ops-type-caption">
        <Link to={backHref} className="ops-text-accent hover:underline">
          ← {backLabel}
        </Link>
        <span className="ops-text-muted">·</span>
        <span className="ops-font-mono ops-text-muted">{subdomain}</span>
        <span className="ops-font-mono ops-text-muted">{tenantIdShort}</span>
      </div>

      <OpsPanel>
        <OpsPanelBody className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <h1 className="ops-type-h2 ops-text m-0">{tenantName}</h1>
              <div
                className="flex flex-wrap items-center gap-2"
                data-testid="ops-hub-seals"
              >
                {planCodeText ? (
                  <OpsPlanSeal code={planCodeText} />
                ) : (
                  <OpsPlanSeal name={planName} />
                )}
                <OpsLifecycleSeal tone={lifecycleStageSealTone(lifecycleStage)}>
                  {getLifecycleStageLabel(lifecycleStage)}
                </OpsLifecycleSeal>
                <OpsBadge tone={accessTone(accessStatus)}>
                  {PLATFORM_TENANT_STATUS_LABELS[accessStatus]}
                </OpsBadge>
              </div>
              {saasBanner ? (
                <p className="ops-type-caption ops-text-muted m-0">{saasBanner}</p>
              ) : null}
              {pastDueLabel ? (
                <div
                  className="ops-type-body ops-text m-0 flex flex-wrap items-center gap-2"
                  data-ops-tick="warn"
                >
                  <span>{pastDueLabel}</span>
                  {onViewCollections ? (
                    <button
                      type="button"
                      className="ops-btn ops-btn-ghost ops-btn-sm"
                      onClick={onViewCollections}
                    >
                      {opsCopy.hub.strip.viewAr}
                    </button>
                  ) : null}
                </div>
              ) : null}
              {trialEndsLabel ? (
                <p className="ops-type-caption ops-text-muted m-0">
                  {trialEndsLabel}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="relative flex flex-wrap items-center gap-1.5">
                {actions}
              </div>
            ) : null}
          </div>
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
