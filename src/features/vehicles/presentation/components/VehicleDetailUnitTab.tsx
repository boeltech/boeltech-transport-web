import { Link } from "react-router-dom";
import { FileText, Truck } from "lucide-react";
import { Card, CardContent } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import { DetailSection, InfoRow } from "@shared/ui/data-display";
import { formatBranchLabel } from "@shared/utils/branchSelectUtils";
import type { Vehicle } from "../../domain";
import { vehiclesCopy } from "../copy";
import { useVehicleCatalogLabels } from "../hooks/useVehicleCatalogLabels";
import { VehicleOperationalExpenseCard } from "./VehicleOperationalExpenseCard";

const copy = vehiclesCopy.detail;

function fmtOptional(s: string | null): string {
  return s?.trim() ? s : copy.hint.empty;
}

function fmtPeso(ton: number | null): string {
  if (ton === null) return copy.hint.empty;
  return copy.format.pesoBruto(ton);
}

/** True when the string is a CSS color the browser can paint (hex / rgb / hsl / named). */
function isPaintableCssColor(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true;
  if (/^(rgb|hsl)a?\(/i.test(v)) return true;
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
    return CSS.supports("color", v);
  }
  return false;
}

function ColorValue({
  color,
  emptyHint,
}: {
  color: string;
  emptyHint: string;
}) {
  if (!color) return <>{emptyHint}</>;
  const paint = isPaintableCssColor(color);
  return (
    <span className="inline-flex items-center gap-2">
      {paint ? (
        <span
          className="h-3 w-3 shrink-0 rounded-full ring-1 ring-border"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      ) : null}
      {color}
    </span>
  );
}

function CatalogLabelValue({
  isLoading,
  label,
}: {
  isLoading: boolean;
  label: string | null;
}) {
  if (isLoading) {
    return (
      <span className="text-sm text-muted-foreground">
        {copy.hint.catalogLoading}
      </span>
    );
  }
  return label ?? copy.hint.empty;
}

interface VehicleDetailUnitTabProps {
  vehicle: Vehicle;
}

export function VehicleDetailUnitTab({ vehicle }: VehicleDetailUnitTabProps) {
  const { capacities, cartaPorte } = vehicle;
  const labels = useVehicleCatalogLabels();
  const branchLabel = formatBranchLabel(vehicle.branchName, vehicle.branchCode);

  return (
    <div className="space-y-8">
      <DetailSection
        icon={<Truck className="h-4 w-4" />}
        title={copy.section.unitData.title}
        description={copy.section.unitData.description}
      >
        <Card>
          <CardContent className="space-y-0 pt-6">
            <InfoRow
              variant="inline"
              label={copy.label.vin}
              value={vehicle.vin ?? copy.hint.empty}
              copyable={Boolean(vehicle.vin)}
              copyValue={vehicle.vin ?? undefined}
              mono
            />
            {vehicle.color?.trim() ? (
              <InfoRow
                variant="inline"
                label={copy.label.color}
                value={
                  <ColorValue
                    color={vehicle.color.trim()}
                    emptyHint={copy.hint.empty}
                  />
                }
              />
            ) : null}
            <InfoRow
              variant="inline"
              label={copy.label.baseBranch}
              value={
                vehicle.branchId && branchLabel ? (
                  <Link
                    to={`/branches/${vehicle.branchId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {branchLabel}
                  </Link>
                ) : (
                  (branchLabel ?? copy.hint.empty)
                )
              }
            />
            <InfoRow
              variant="inline"
              label={copy.label.volumeCapacity}
              value={
                capacities.volumeCapacity
                  ? copy.format.volume(capacities.volumeCapacity)
                  : copy.hint.emptyOptional
              }
            />
          </CardContent>
        </Card>
      </DetailSection>

      <VehicleOperationalExpenseCard vehicleId={vehicle.id} />

      <DetailSection
        icon={<FileText className="h-4 w-4" />}
        title={copy.section.permitConfig.title}
        description={copy.section.permitConfig.description}
      >
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.section.permitConfig.groupPermit}
              </p>
              <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                <InfoRow
                  variant="inline"
                  label={copy.label.tipoPermiso}
                  value={
                    <CatalogLabelValue
                      isLoading={labels.isLoading}
                      label={labels.tipoPermisoLabel(
                        cartaPorte.satTipoPermisoCode,
                      )}
                    />
                  }
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.configVehicular}
                  value={
                    <CatalogLabelValue
                      isLoading={labels.isLoading}
                      label={labels.configVehicularLabel(
                        cartaPorte.satConfigAutotransporteCode,
                      )}
                    />
                  }
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.pesoBruto}
                  value={fmtPeso(cartaPorte.pesoBrutoVehicular)}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {copy.hint.trailerAssignedOnTrip}
              </p>
            </div>

            <Separator />

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.section.permitConfig.groupOptionalInsurance}
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                {copy.section.permitConfig.optionalInsuranceHint}
              </p>
              <InfoRow
                variant="inline"
                label={copy.label.aseguraMedioAmbiente}
                value={fmtOptional(cartaPorte.aseguraMedioAmbiente)}
              />
              <InfoRow
                variant="inline"
                label={copy.label.polizaMedioAmbiente}
                value={fmtOptional(cartaPorte.polizaMedioAmbiente)}
              />
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                {copy.section.permitConfig.cargoInsuranceFootnote}
              </p>
            </div>
          </CardContent>
        </Card>
      </DetailSection>
    </div>
  );
}
