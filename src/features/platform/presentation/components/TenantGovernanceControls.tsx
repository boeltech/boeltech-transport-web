import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { resolvePastDueGraceDeadline } from "@features/billing/presentation/utils/billingGrace";
import {
  DECLARED_FLEET_BANDS,
  type DeclaredFleetBand,
} from "@shared/commercial/recommendOperationalPlan";
import {
  PlatformTenantStatus,
  type PlatformTenantDetail,
  type PlatformTenantStatusType,
} from "../../domain/entities";
import { usePlatformTenantSubscription } from "../../application/hooks/usePlatformBilling";
import { useUpdateDeclaredFleet } from "../../application/hooks/usePlatformTenants";
import { platformCopy } from "../copy/platformCopy";

const FLEET_BAND_NONE = "__none__";

interface TenantGovernanceControlsProps {
  tenant: PlatformTenantDetail;
  canMutate: boolean;
  onManageSubscription: () => void;
}

function accessEffect(status: PlatformTenantStatusType): string {
  const effects = platformCopy.tenants.detail.governance.accessEffect;
  if (status === PlatformTenantStatus.SUSPENDED) return effects.suspended;
  if (status === PlatformTenantStatus.CANCELLED) return effects.cancelled;
  return effects.active;
}

function commercialEffect(status: string | null | undefined): string {
  const effects = platformCopy.tenants.detail.governance.commercialEffect;
  if (!status) return effects.missing;
  return effects[status as keyof typeof effects] ?? status;
}

function declaredFleetDisplay(
  band: string | null,
  units: number | null,
): string {
  const copy = platformCopy.tenants.detail.governance;
  if (!band) return copy.declaredFleetNone;
  const bandLabel = platformCopy.tenants.create.fleetBands[band] ?? band;
  return copy.declaredFleetValue(bandLabel, units);
}

export function TenantGovernanceControls({
  tenant,
  canMutate,
  onManageSubscription,
}: TenantGovernanceControlsProps) {
  const copy = platformCopy.tenants.detail.governance;
  const { toast } = useToast();
  const [helpOpen, setHelpOpen] = useState(false);
  const [editingFleet, setEditingFleet] = useState(false);
  const [fleetBand, setFleetBand] = useState<string>(
    tenant.declaredFleetBand ?? FLEET_BAND_NONE,
  );
  const [fleetUnits, setFleetUnits] = useState(
    tenant.declaredFleetUnits != null ? String(tenant.declaredFleetUnits) : "",
  );

  const { data: subscription, isLoading } = usePlatformTenantSubscription(
    tenant.id,
  );

  const fleetMutation = useUpdateDeclaredFleet({
    onSuccess: () => {
      toast({ title: copy.declaredFleetSuccess, variant: "success" });
      setEditingFleet(false);
    },
    onError: (error) => {
      toast({
        title: copy.declaredFleetError,
        description: mapBackendError(error).message,
        variant: "error",
      });
    },
  });

  const commercialStatus = subscription?.status ?? tenant.subscriptionStatus;
  const isPastDue = commercialStatus === "past_due";
  const graceDeadline = resolvePastDueGraceDeadline(
    subscription?.currentPeriodStart,
  );
  const graceDeadlineLabel = graceDeadline
    ? formatDate(graceDeadline.toISOString())
    : "";

  const startEditFleet = () => {
    setFleetBand(tenant.declaredFleetBand ?? FLEET_BAND_NONE);
    setFleetUnits(
      tenant.declaredFleetUnits != null
        ? String(tenant.declaredFleetUnits)
        : "",
    );
    setEditingFleet(true);
  };

  const saveFleet = () => {
    const band: DeclaredFleetBand | null =
      fleetBand === FLEET_BAND_NONE
        ? null
        : (fleetBand as DeclaredFleetBand);
    const unitsRaw = fleetUnits.trim();
    const units =
      unitsRaw === ""
        ? null
        : Number.isFinite(Number(unitsRaw))
          ? Math.max(0, Math.floor(Number(unitsRaw)))
          : null;
    fleetMutation.mutate({
      id: tenant.id,
      payload: {
        declaredFleetBand: band,
        declaredFleetUnits: units,
      },
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="text-base">{copy.title}</CardTitle>
        <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-xs text-muted-foreground hover:bg-transparent"
            >
              {helpOpen ? copy.helpHide : copy.helpLabel}
              <ChevronDown
                aria-hidden
                className={cn(
                  "ml-1 h-3.5 w-3.5 transition-transform",
                  helpOpen && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-1">
            <p className="text-sm text-muted-foreground">{copy.helpBody}</p>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Effects only — badges live in ATF strip (H4 / D5). */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.accessTitle}
            </p>
            <p className="mt-2 text-sm">{accessEffect(tenant.status)}</p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.commercialTitle}
            </p>
            {isLoading && !commercialStatus ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {copy.commercialLoading}
              </p>
            ) : (
              <p className="mt-2 text-sm">
                {commercialEffect(commercialStatus)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">{copy.declaredFleetLabel}</p>
            {canMutate && !editingFleet ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startEditFleet}
              >
                {copy.declaredFleetEdit}
              </Button>
            ) : null}
          </div>

          {editingFleet && canMutate ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="space-y-2">
                <Label htmlFor="declared-fleet-band">
                  {copy.declaredFleetBandLabel}
                </Label>
                <Select value={fleetBand} onValueChange={setFleetBand}>
                  <SelectTrigger id="declared-fleet-band">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FLEET_BAND_NONE}>
                      {copy.declaredFleetBandNone}
                    </SelectItem>
                    {DECLARED_FLEET_BANDS.map((band) => (
                      <SelectItem key={band} value={band}>
                        {platformCopy.tenants.create.fleetBands[band]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="declared-fleet-units">
                  {copy.declaredFleetUnitsLabel}
                </Label>
                <Input
                  id="declared-fleet-units"
                  inputMode="numeric"
                  value={fleetUnits}
                  onChange={(e) => setFleetUnits(e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  isLoading={fleetMutation.isPending}
                  onClick={saveFleet}
                >
                  {fleetMutation.isPending
                    ? copy.declaredFleetSaving
                    : copy.declaredFleetSave}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={fleetMutation.isPending}
                  onClick={() => setEditingFleet(false)}
                >
                  {copy.declaredFleetCancel}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {declaredFleetDisplay(
                tenant.declaredFleetBand,
                tenant.declaredFleetUnits,
              )}
            </p>
          )}
        </div>

        {isPastDue ? (
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <p className="text-sm text-muted-foreground">
              {graceDeadlineLabel
                ? copy.grace.orientation(graceDeadlineLabel)
                : copy.grace.orientationMissing}
            </p>
            {canMutate ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onManageSubscription}
              >
                {copy.grace.openSubscription}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                {copy.grace.readOnlyHint}
              </p>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
