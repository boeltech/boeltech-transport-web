/**
 * Recortes del listado de empresas platform.
 * Shell canónico: `ListingFilterPanel`. Search / refresh / CTA viven fuera.
 */

import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  PLATFORM_LIFECYCLE_STAGE_VALUES,
  PLATFORM_SUBSCRIPTION_STATUS_VALUES,
  PLATFORM_TENANT_STATUS_LABELS,
  PlatformTenantStatus,
} from "../../domain/entities";
import { getLifecycleStageLabel } from "../config/platformLifecycleConfig";
import { platformCopy } from "../copy/platformCopy";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";

type HealthBand = "healthy" | "watch" | "risk";

export interface PlatformPlanOption {
  code: string;
  name: string;
}

export interface PlatformTenantListFiltersProps {
  access: string;
  commercial: string;
  plan: string;
  stage: string;
  atRisk: string;
  health: string;
  plans: PlatformPlanOption[];
  activePanelFilterCount: number;
  onAccessChange: (value: string) => void;
  onCommercialChange: (value: string) => void;
  onPlanChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onAtRiskChange: (value: string) => void;
  onHealthChange: (value: string) => void;
}

function healthBandLabel(band: string): string {
  const copy = platformCopy.tenants.list.filters;
  if (band === "healthy") return copy.healthHealthy;
  if (band === "watch") return copy.healthWatch;
  if (band === "risk") return copy.healthRisk;
  return band;
}

export function PlatformTenantListFilters({
  access,
  commercial,
  plan,
  stage,
  atRisk,
  health,
  plans,
  activePanelFilterCount,
  onAccessChange,
  onCommercialChange,
  onPlanChange,
  onStageChange,
  onAtRiskChange,
  onHealthChange,
}: PlatformTenantListFiltersProps) {
  const copy = platformCopy.tenants.list.filters;

  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="platform-tenants-filter-access">{copy.access}</Label>
        <Select
          value={access || "all"}
          onValueChange={(value) =>
            onAccessChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger id="platform-tenants-filter-access" className="w-full">
            <SelectValue placeholder={copy.access} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allAccess}</SelectItem>
            {Object.values(PlatformTenantStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {PLATFORM_TENANT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="platform-tenants-filter-commercial">
          {copy.commercial}
        </Label>
        <Select
          value={commercial || "all"}
          onValueChange={(value) =>
            onCommercialChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger
            id="platform-tenants-filter-commercial"
            className="w-full"
          >
            <SelectValue placeholder={copy.commercial} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allCommercial}</SelectItem>
            {PLATFORM_SUBSCRIPTION_STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status}>
                {getPlatformSubscriptionStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="platform-tenants-filter-stage">{copy.stage}</Label>
        <Select
          value={stage || "all"}
          onValueChange={(value) =>
            onStageChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger id="platform-tenants-filter-stage" className="w-full">
            <SelectValue placeholder={copy.stage} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allStages}</SelectItem>
            {PLATFORM_LIFECYCLE_STAGE_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {getLifecycleStageLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="platform-tenants-filter-at-risk">{copy.atRisk}</Label>
        <Select
          value={atRisk || "all"}
          onValueChange={(value) =>
            onAtRiskChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger id="platform-tenants-filter-at-risk" className="w-full">
            <SelectValue placeholder={copy.atRisk} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allRisk}</SelectItem>
            <SelectItem value="true">{copy.atRiskOnly}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="platform-tenants-filter-health">{copy.health}</Label>
        <Select
          value={health || "all"}
          onValueChange={(value) =>
            onHealthChange(value === "all" ? "" : value)
          }
        >
          <SelectTrigger id="platform-tenants-filter-health" className="w-full">
            <SelectValue placeholder={copy.health} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allHealth}</SelectItem>
            {(["healthy", "watch", "risk"] as HealthBand[]).map((band) => (
              <SelectItem key={band} value={band}>
                {healthBandLabel(band)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="platform-tenants-filter-plan">{copy.plan}</Label>
        <Select
          value={plan || "all"}
          onValueChange={(value) => onPlanChange(value === "all" ? "" : value)}
        >
          <SelectTrigger id="platform-tenants-filter-plan" className="w-full">
            <SelectValue placeholder={copy.plan} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.allPlans}</SelectItem>
            {plans.map((planOption) => (
              <SelectItem key={planOption.code} value={planOption.code}>
                {planOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
