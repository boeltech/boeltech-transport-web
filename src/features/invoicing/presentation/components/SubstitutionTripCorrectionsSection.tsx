import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { useTrip } from "@features/trips/application/hooks/trip/useTrip";
import type { Invoice, InvoiceTripRef } from "@features/invoicing/domain";
import { getStopTypeConfig } from "@features/trips/presentation/uiHelpers";
import { getEffectiveStopRfc } from "@features/trips/presentation/components/trip-fiscal/tripFiscalHelpers";
import { TripFiscalCorrectionSheet } from "@features/trips/presentation/components/trip-fiscal/TripFiscalCorrectionSheet";
import { TripStopAddressSingleLine } from "@features/trips/presentation/components/TripStopAddressLines";
import { usePermissions } from "@shared/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Button } from "@shared/ui/button";
import { HintIcon } from "@shared/ui/hint-icon";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  type SubstituteInvoiceSheetValues,
  type TripCorrectionFormEntry,
} from "../validation/substitutionCorrectionsSchema";
import {
  SUBSTITUTION_COLLAPSIBLE_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS,
  SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS,
} from "./substitutionSheetLayout";

const copy = invoicingCopy.detail.substitute.trips;
const sheetCopy = invoicingCopy.detail.substitute;

type EditMode = "rfc" | "address";

interface Props {
  invoice: Invoice;
  control: Control<SubstituteInvoiceSheetValues>;
  setValue: UseFormSetValue<SubstituteInvoiceSheetValues>;
  sheetOpen: boolean;
}

function TripStopsLoader({
  tripRef,
  enabled,
  savedStopIds,
  savedAddressStopIds,
  canExecuteStopFiscal,
  canExecuteTripFiscal,
  onEditStop,
}: {
  tripRef: InvoiceTripRef;
  enabled: boolean;
  savedStopIds: Set<string>;
  savedAddressStopIds: Set<string>;
  canExecuteStopFiscal: boolean;
  canExecuteTripFiscal: boolean;
  onEditStop: (tripId: string, stopId: string, mode: EditMode, clientId: string | null) => void;
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
          const isRfcSaved = savedStopIds.has(stop.id);
          const isAddressSaved = savedAddressStopIds.has(stop.id);

          return (
            <li key={stop.id} className="rounded-lg border p-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {copy.stopLabel(stop.sequenceOrder, stopTypeLabel)}
                  </p>
                  <TripStopAddressSingleLine
                    stop={stop}
                    className="break-words text-xs text-muted-foreground"
                  />
                  <p className="mt-1 break-all font-mono text-xs">{effectiveRfc}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canExecuteStopFiscal}
                    onClick={() => onEditStop(tripRef.tripId, stop.id, "rfc", trip.clientId)}
                  >
                    {isRfcSaved ? copy.editAgain : copy.correctStop}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canExecuteTripFiscal}
                    onClick={() =>
                      onEditStop(tripRef.tripId, stop.id, "address", trip.clientId)
                    }
                  >
                    {isAddressSaved ? copy.editAgain : copy.correctAddress}
                  </Button>
                </div>
              </div>
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
  const canExecuteStopFiscal = hasPermission("trips_stops_fiscal", "execute");
  const canExecuteTripFiscal = hasPermission("trips_fiscal_edit", "execute");
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editingStopId, setEditingStopId] = useState<string | null>(null);
  const [editingMode, setEditingMode] = useState<EditMode | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const { data: editingTrip } = useTrip(editingTripId ?? "", {
    enabled: sheetOpen && editingTripId != null,
  });

  const tripCorrections = useWatch({ control, name: "trip_corrections" }) ?? [];
  const savedStopIds = useMemo(
    () =>
      new Set(
        tripCorrections
          .filter((entry) => entry.stop_id && entry.rfc_remitente_destinatario)
          .map((entry) => entry.stop_id!),
      ),
    [tripCorrections],
  );
  const savedAddressStopIds = useMemo(
    () =>
      new Set(
        tripCorrections
          .filter(
            (entry) => entry.stop_id && (entry.address_id || entry.stop_address),
          )
          .map((entry) => entry.stop_id!),
      ),
    [tripCorrections],
  );

  const handleSaveCorrection = (entry: TripCorrectionFormEntry) => {
    const next = [
      ...tripCorrections.filter((item) => {
        if (item.trip_id !== entry.trip_id) return true;
        if (entry.driver_id || entry.vehicle_id) {
          return !(item.driver_id || item.vehicle_id);
        }
        if (entry.stop_id && item.stop_id === entry.stop_id) {
          if (entry.address_id || entry.stop_address) {
            return !(item.address_id || item.stop_address);
          }
          return !item.rfc_remitente_destinatario;
        }
        return true;
      }),
      entry,
    ];
    setValue("trip_corrections", next, { shouldDirty: true });
    setEditingTripId(null);
    setEditingStopId(null);
    setEditingMode(null);
    setEditingClientId(null);
  };

  const activeStop = editingStopId
    ? editingTrip?.stops?.find((stop) => stop.id === editingStopId)
    : undefined;

  if (invoice.trips.length === 0) {
    return null;
  }

  return (
    <>
      <Collapsible defaultOpen={false} className={SUBSTITUTION_COLLAPSIBLE_CLASS}>
        <CollapsibleTrigger className={SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS}>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>{copy.sectionTitle}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {sheetCopy.optionalBadge}
            </span>
          </span>
          <ChevronDown className={SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS} />
        </CollapsibleTrigger>
        <CollapsibleContent className={SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS}>
          {canExecuteStopFiscal || canExecuteTripFiscal ? (
            <div className="flex items-start gap-1 text-xs text-muted-foreground">
              <p className="min-w-0 flex-1">{copy.sectionHint}</p>
              <HintIcon label={sheetCopy.sectionHintMoreLabel}>
                {copy.sectionHintDetail}
              </HintIcon>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{copy.noPermission}</p>
          )}

          <div className="space-y-3">
            {invoice.trips.map((tripRef) => (
              <TripStopsLoader
                key={tripRef.tripId}
                tripRef={tripRef}
                enabled={sheetOpen}
                savedStopIds={savedStopIds}
                savedAddressStopIds={savedAddressStopIds}
                canExecuteStopFiscal={canExecuteStopFiscal}
                canExecuteTripFiscal={canExecuteTripFiscal}
                onEditStop={(tripId, stopId, mode, clientId) => {
                  setEditingTripId(tripId);
                  setEditingStopId(stopId);
                  setEditingMode(mode);
                  setEditingClientId(clientId);
                }}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {activeStop && editingTripId && editingMode ? (
        <TripFiscalCorrectionSheet
          mode="defer"
          tripId={editingTripId}
          stop={activeStop}
          clientId={editingClientId}
          correctionKind={editingMode}
          open
          submitLabel={copy.saveStopCorrection}
          addressSubmitLabel={copy.saveStopCorrection}
          addressCopy={invoicingCopy.detail.substitute.address}
          canExecute={
            editingMode === "rfc" ? canExecuteStopFiscal : canExecuteTripFiscal
          }
          onOpenChange={(open) => {
            if (!open) {
              setEditingTripId(null);
              setEditingStopId(null);
              setEditingMode(null);
              setEditingClientId(null);
            }
          }}
          onDeferSave={handleSaveCorrection}
        />
      ) : null}
    </>
  );
}
