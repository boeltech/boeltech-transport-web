import { useMemo } from "react";
import { useEmployee } from "@features/employees";
import { useTrips } from "@features/trips";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { settlementsCopy } from "../copy/settlementsCopy";

const NO_TRIP = "__none__";
const copy = settlementsCopy.advancesDialog;

export interface AdvanceTripOption {
  tripId: string;
  tripCode: string;
}

export interface AdvanceTripSelectProps {
  id: string;
  employeeId: string;
  value: string;
  onChange: (tripId: string, meta?: { tripCode?: string }) => void;
  disabled?: boolean;
  error?: string;
  /** Opción vigente (edit) si no viene en el listado del operador. */
  currentOption?: AdvanceTripOption | null;
}

/**
 * Etiqueta opcional viaje↔anticipo. No afecta margen/P&L del viaje.
 * Resuelve employee → driverId y lista viajes del operador.
 */
export function AdvanceTripSelect({
  id,
  employeeId,
  value,
  onChange,
  disabled = false,
  error,
  currentOption = null,
}: AdvanceTripSelectProps) {
  const { data: employeeResult, isLoading: employeeLoading } = useEmployee(
    employeeId,
    Boolean(employeeId),
  );
  const driverId = employeeResult?.data.driverRole?.driverId ?? null;
  const hasDriver = Boolean(driverId);

  const { data: tripsResult } = useTrips(
    {
      page: 1,
      limit: 100,
      filters: { driverId: driverId ?? undefined },
    },
    { enabled: hasDriver },
  );

  const tripOptions = useMemo(() => {
    const items = tripsResult?.data ?? [];
    const mapped: AdvanceTripOption[] = items.map((trip) => ({
      tripId: trip.id,
      tripCode: trip.tripCode,
    }));
    if (
      currentOption?.tripId &&
      !mapped.some((trip) => trip.tripId === currentOption.tripId)
    ) {
      return [currentOption, ...mapped];
    }
    return mapped;
  }, [tripsResult?.data, currentOption]);

  const selectDisabled = disabled || !employeeId || !hasDriver || employeeLoading;
  const selectValue = value?.trim() && value !== NO_TRIP ? value : NO_TRIP;

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{copy.tripLabel}</Label>
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next === NO_TRIP) {
            onChange("");
            return;
          }
          const match = tripOptions.find((trip) => trip.tripId === next);
          onChange(next, { tripCode: match?.tripCode });
        }}
        disabled={selectDisabled}
      >
        <SelectTrigger id={id} {...getFieldErrorAriaProps(id, error)}>
          <SelectValue
            placeholder={
              !employeeId
                ? copy.employeePlaceholder
                : !hasDriver && !employeeLoading
                  ? copy.tripNoDriver
                  : copy.tripNone
            }
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_TRIP}>{copy.tripNone}</SelectItem>
          {tripOptions.map((trip) => (
            <SelectItem key={trip.tripId} value={trip.tripId}>
              {trip.tripCode}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {employeeId && !hasDriver && !employeeLoading ? (
        <p className="text-xs text-muted-foreground">{copy.tripNoDriver}</p>
      ) : null}
      <FieldInlineError fieldId={id} message={error} />
    </div>
  );
}

/** Resuelve código de viaje para el diff D18 (etiqueta legible). */
export function resolveAdvanceTripLabel(
  tripId: string | null | undefined,
  options: ReadonlyArray<AdvanceTripOption>,
  fallbackCode?: string | null,
): string {
  const id = tripId?.trim() || null;
  if (!id || id === NO_TRIP) return copy.tripNone;
  const match = options.find((t) => t.tripId === id);
  return match?.tripCode ?? fallbackCode ?? id;
}