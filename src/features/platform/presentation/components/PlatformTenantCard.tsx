/**
 * Tarjeta móvil del padrón de empresas platform.
 * EntityListCard tocable; sin menú ⋯ (navegación al detalle).
 */

import { useNavigate } from "react-router-dom";
import { CardContent, CardHeader } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { EntityListCard } from "@shared/ui/listing";
import type { PlatformTenantListItem } from "../../domain/entities";
import { PlatformTenantStatusBadge } from "../config/platformTenantStatusConfig";
import { TenantLifecycleBadge } from "../config/platformLifecycleConfig";
import { TenantHealthDot } from "./TenantHealthDot";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";

export interface PlatformTenantCardProps {
  tenant: PlatformTenantListItem;
}

export function PlatformTenantCard({ tenant }: PlatformTenantCardProps) {
  const navigate = useNavigate();

  return (
    <EntityListCard onClick={() => navigate(`/platform/tenants/${tenant.id}`)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium">{tenant.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {tenant.subdomain}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <TenantHealthDot score={tenant.healthScore} />
            <TenantLifecycleBadge status={tenant.lifecycleStage} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex flex-wrap gap-1">
          <PlatformTenantStatusBadge status={tenant.status} />
          {tenant.subscriptionStatus ? (
            <Badge variant="secondary" tone="soft">
              {getPlatformSubscriptionStatusLabel(tenant.subscriptionStatus)}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {tenant.planName ?? tenant.planCode ?? "—"}
        </p>
      </CardContent>
    </EntityListCard>
  );
}
