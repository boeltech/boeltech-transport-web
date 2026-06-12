import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { useTrip } from "@features/trips/application/hooks/trip/useTrip";
import type { Invoice, InvoiceTripRef } from "@features/invoicing/domain";
import { getStopTypeConfig } from "@features/trips/presentation/uiHelpers";
import {
  getEffectiveStopRfc,
  formatStopLocation,
} from "@features/trips/presentation/components/trip-fiscal/tripFiscalHelpers";
import { usePermissions } from "@shared/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Button } from "@shared/ui/button";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  type SubstituteInvoiceSheetValues,
  type TripCorrectionFormEntry,
} from "../validation/substitutionCorrectionsSchema";
import { FixStopRfcDeferredForm } from "./FixStopRfcDeferredForm";

const copy = invoicingCopy.detail.substitute.trips;

interface Props {
  invoice: Invoice;
  control: Control<SubstituteInvoiceSheetValues>;
  setValue: UseFormSetValue<SubstituteInvoiceSheetValues>;
  sheetOpen: boolean;
}

function TripStopsLoader({
  tripRef,
  enabled,
  editingStopId,
  savedStopIds,
  canExecute,
  onEditStop,
  onCancelEdit,
  onSaveCorrection,
}: {
  tripRef: InvoiceTripRef;
  enabled: boolean;
  editingStopId: string | null;
  savedStopIds: Set<string>;
  canExecute: boolean;
  onEditStop: (stopId: string) => void;
  onCancelEdit: () => void;
  onSaveCorrection: (entry: TripCorrectionFormEntry) => void;
}) {
  const { data: trip, isLoading } = useTrip(tripRef.tripId, { enabled });

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        {copy.loadingTrip(tripRef.tripCode)}
      </p>
    );
  }

  if (!trip?.stops?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {copy.noStops(tripRef.tripCode)}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        {copy.tripHeading(tripRef.tripCode, tripRef.originCity, tripRef.destinationCity)}
      </p>
      <ul className="space-y-2">
        {trip.stops.map((stop) => {
          const stopTypeLabel = (Array.isArray(stop.stopType)
            ? stop.stopType
            : [stop.stopType]
          )
            .map((type) => getStopTypeConfig(type).label)
            .join(" · ");
          const effectiveRfc = getEffectiveStopRfc(stop) ?? "—";
          const isEditing = editingStopId === stop.id;
          const isSaved = savedStopIds.has(stop.id);

          return (
            <li key={stop.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {copy.stopLabel(stop.sequenceOrder, stopTypeLabel)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatStopLocation(stop)}
                  </p>
                  <p className="mt-1 font-mono text-xs">{effectiveRfc}</p>
                </div>
                {!isEditing ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canExecute}
                    onClick={() => onEditStop(stop.id)}
                  >
                    {isSaved ? copy.editAgain : copy.correctStop}
                  </Button>
                ) : null}
              </div>

              {isEditing ? (
                <div className="mt-3">
                  <FixStopRfcDeferredForm
                    tripId={tripRef.tripId}
                    stop={stop}
                    canExecute={canExecute}
                    submitLabel={copy.saveStopCorrection}
                    onSave={onSaveCorrection}
                    onCancel={onCancelEdit}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SubstitutionTripCorrectionsSection({
  invoice,
  control,
  setValue,
  sheetOpen,
}: Props) {
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("trips_stops_fiscal", "execute");
  const [editingStopId, setEditingStopId] = useState<string | null>(null);

  const tripCorrections = useWatch({ control, name: "trip_corrections" }) ?? [];
  const savedStopIds = useMemo(
    () => new Set(tripCorrections.map((entry) => entry.stop_id)),
    [tripCorrections],
  );

  const handleSaveCorrection = (entry: TripCorrectionFormEntry) => {
    const next = [
      ...tripCorrections.filter((item) => item.stop_id !== entry.stop_id),
      entry,
    ];
    setValue("trip_corrections", next, { shouldDirty: true });
    setEditingStopId(null);
  };

  if (invoice.trips.length === 0) {
    return null;
  }

  return (
    <Collapsible defaultOpen={false}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-medium hover:bg-muted/50">
        <span>{copy.sectionTitle}</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 px-1 pt-3">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {canExecute ? copy.sectionHint : copy.noPermission}
        </p>

        {invoice.trips.map((tripRef) => (
          <TripStopsLoader
            key={tripRef.tripId}
            tripRef={tripRef}
            enabled={sheetOpen}
            editingStopId={editingStopId}
            savedStopIds={savedStopIds}
            canExecute={canExecute}
            onEditStop={setEditingStopId}
            onCancelEdit={() => setEditingStopId(null)}
            onSaveCorrection={handleSaveCorrection}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
