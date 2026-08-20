import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { StopRfcPreflightResult } from "@boeltech/cfdi-domain";
import { useStampInvoice } from "@features/invoicing/application";
import type { InvoiceTripRef } from "@features/invoicing/domain";
import { createGetTripByIdUseCase } from "@features/trips/application";
import {
  tripQueryKeys,
  type PatchTripStopFiscalResult,
  type Trip,
  type TripStop,
} from "@features/trips/domain";
import { tripRepository } from "@features/trips/infrastructure";
import { parseInvalidRfcAtStopDetails } from "@shared/api/errors/invalidRfcAtStopError";
import { useToast } from "@shared/hooks";
import { buildOverlayErrorToastDescription } from "@shared/utils/overlayErrorFeedback";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import { TripFiscalCorrectionSheet } from "./TripFiscalCorrectionSheet";
import { PreflightBlockerSheet } from "./PreflightBlockerSheet";
import { StopPickerSheet } from "./StopPickerSheet";
import { describeStampApiError } from "./stampErrorDescription";
import {
  collectStopsFromTrips,
  finalizeTripsForStampLoad,
  findStopInTrips,
  isStopRfcInvalidForStamp,
  mergePatchedStopIntoTrip,
  resolveIsStampBusy,
  resolvePostFiscalFixStampMode,
  resolveTripIdForStop,
  runTripStopsPreflight,
  shouldBlockConcurrentStampRequest,
  shouldShowFiscalWarningChip,
  shouldShowFiscalCorrectionChip,
  toFiscalStopDisplayOrder,
} from "./tripFiscalHelpers";

const stampCopy = tripFiscalCopy.stamp;

type UseTripFiscalSheetsOptions = {
  trip?: Trip;
  invoiceTripRefs?: readonly InvoiceTripRef[];
  enableAutoRestamp?: boolean;
  onStampSuccess?: () => void;
  getStampErrorDescription?: (error: unknown) => string;
};

export function useTripFiscalSheets(options: UseTripFiscalSheetsOptions = {}) {
  const {
    trip,
    invoiceTripRefs = [],
    enableAutoRestamp = false,
    onStampSuccess,
    getStampErrorDescription = describeStampApiError,
  } = options;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const getTripById = useMemo(
    () => createGetTripByIdUseCase(tripRepository),
    [],
  );

  const [fixStopId, setFixStopId] = useState<string | null>(null);
  const [fixSubmitLabel, setFixSubmitLabel] = useState<string | undefined>();
  const [fixCorrectionKind, setFixCorrectionKind] = useState<"rfc" | "address">("rfc");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [preflightResult, setPreflightResult] =
    useState<StopRfcPreflightResult | null>(null);
  const [loadedTrips, setLoadedTrips] = useState<Trip[]>([]);
  const [pendingStampInvoiceId, setPendingStampInvoiceId] = useState<
    string | null
  >(null);
  const [stampOverlayError, setStampOverlayError] = useState<string | null>(
    null,
  );
  const [isPreparingStamp, setIsPreparingStamp] = useState(false);
  const preparingStampRef = useRef(false);

  const releasePreparingStamp = useCallback(() => {
    preparingStampRef.current = false;
    setIsPreparingStamp(false);
  }, []);

  const { mutate: stamp, isPending: isStamping } = useStampInvoice({
    onSuccess: () => {
      setPendingStampInvoiceId(null);
      releasePreparingStamp();
      toast({ variant: "success", title: "Factura timbrada exitosamente" });
      onStampSuccess?.();
    },
    onError: (error, invoiceId) => {
      releasePreparingStamp();
      handleStampError(error, invoiceId);
    },
  });

  const contextTrips = useMemo(() => {
    const trips: Trip[] = [];
    if (trip) trips.push(trip);
    for (const loaded of loadedTrips) {
      if (!trips.some((item) => item.id === loaded.id)) {
        trips.push(loaded);
      }
    }
    return trips;
  }, [trip, loadedTrips]);

  const allStops = useMemo(
    () => collectStopsFromTrips(contextTrips),
    [contextTrips],
  );

  const stopsById = useMemo(() => {
    const map = new Map<string, TripStop>();
    for (const stop of allStops) {
      map.set(stop.id, stop);
    }
    return map;
  }, [allStops]);

  const invalidPickerStops = useMemo(
    () => allStops.filter(isStopRfcInvalidForStamp),
    [allStops],
  );

  const pickerStops = useMemo(() => {
    if (invalidPickerStops.length > 0) {
      return invalidPickerStops;
    }
    return [...allStops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [allStops, invalidPickerStops]);

  const pickerListMode =
    invalidPickerStops.length > 0 ? "invalid-only" : "all-stops-fallback";

  const resolveTripForStop = useCallback(
    (stopId: string): Trip | null => {
      const match = findStopInTrips(contextTrips, stopId);
      if (match) return match.trip;

      const tripId = resolveTripIdForStop(stopId, {
        trip,
        trips: contextTrips,
        fallbackTripIds: invoiceTripRefs.map((item) => item.tripId),
      });
      if (!tripId) return null;
      return contextTrips.find((item) => item.id === tripId) ?? null;
    },
    [contextTrips, invoiceTripRefs, trip],
  );

  const fetchTripsForStamp = useCallback(
    async (options?: {
      forceRefresh?: boolean;
    }): Promise<ReturnType<typeof finalizeTripsForStampLoad>> => {
      const forceRefresh = options?.forceRefresh === true;

      if (trip && !forceRefresh) {
        return finalizeTripsForStampLoad([trip.id], [trip]);
      }

      const tripIds =
        trip != null
          ? [trip.id]
          : invoiceTripRefs.length > 0
            ? invoiceTripRefs.map((item) => item.tripId)
            : [];

      const fetched: Trip[] = [];
      for (const tripId of tripIds) {
        if (!forceRefresh) {
          const cached = queryClient.getQueryData<Trip>(
            tripQueryKeys.detail(tripId),
          );
          if (cached) {
            fetched.push(cached);
            continue;
          }
        }

        const result = await getTripById.execute(tripId);
        if (result.success) {
          fetched.push(result.data);
          queryClient.setQueryData(tripQueryKeys.detail(tripId), result.data);
        }
      }

      const finalized = finalizeTripsForStampLoad(tripIds, fetched);
      if (finalized.status === "ok") {
        setLoadedTrips(finalized.trips);
      }
      return finalized;
    },
    [getTripById, invoiceTripRefs, queryClient, trip],
  );

  const applyPatchedStopToLocalTrips = useCallback(
    (result: PatchTripStopFiscalResult) => {
      const patchedStop = result.stop;
      const tripId =
        patchedStop.tripId ||
        resolveTripForStop(patchedStop.id)?.id ||
        null;
      if (!tripId) return;

      queryClient.setQueryData<Trip>(tripQueryKeys.detail(tripId), (previous) =>
        previous ? mergePatchedStopIntoTrip(previous, patchedStop) : previous,
      );

      setLoadedTrips((previous) => {
        const exists = previous.some((item) => item.id === tripId);
        if (!exists) return previous;
        return previous.map((item) =>
          item.id === tripId
            ? mergePatchedStopIntoTrip(item, patchedStop)
            : item,
        );
      });
    },
    [queryClient, resolveTripForStop],
  );
  const openFixSheet = useCallback(
    (
      stopId: string,
      sheetOptions?: {
        submitLabel?: string;
        pendingInvoiceId?: string | null;
        correctionKind?: "rfc" | "address";
      },
    ) => {
      setFixStopId(stopId);
      setStampOverlayError(null);
      setFixSubmitLabel(sheetOptions?.submitLabel);
      setFixCorrectionKind(sheetOptions?.correctionKind ?? "rfc");
      if (sheetOptions?.pendingInvoiceId !== undefined) {
        setPendingStampInvoiceId(sheetOptions.pendingInvoiceId);
      }
    },
    [],
  );

  const handleStampError = useCallback(
    (error: unknown, invoiceId?: string) => {
      const parsed = parseInvalidRfcAtStopDetails(error);
      if (parsed) {
        if (invoiceId) setPendingStampInvoiceId(invoiceId);

        if (parsed.stopId) {
          toast({
            variant: "destructive",
            title: stampCopy.errorTitle,
            description: stampCopy.invalidRfcDescription(
              parsed.stopOrder != null
                ? toFiscalStopDisplayOrder(parsed.stopOrder)
                : null,
            ),
            duration: 8000,
            action: {
              label: stampCopy.fixAction,
              onClick: () =>
                openFixSheet(parsed.stopId!, {
                  pendingInvoiceId: invoiceId ?? pendingStampInvoiceId,
                }),
            },
          });
          return;
        }

        setPickerOpen(true);
        return;
      }

      const message = getStampErrorDescription(error);
      const hasInlineOverlay = Boolean(fixStopId);
      if (hasInlineOverlay) {
        setStampOverlayError(message);
      }
      toast({
        variant: "error",
        title: stampCopy.errorTitle,
        // Sin sheet abierto no hay «formulario» inline: mostrar el mensaje completo.
        description: hasInlineOverlay
          ? buildOverlayErrorToastDescription(
              message,
              tripFiscalCopy.overlayErrorSeeInline,
            )
          : message,
        duration: message.length > 120 ? 10000 : undefined,
      });
    },
    [
      fixStopId,
      getStampErrorDescription,
      openFixSheet,
      pendingStampInvoiceId,
      toast,
    ],
  );

  const requestStamp = useCallback(
    async (
      invoiceId: string,
      options?: {
        forceRefresh?: boolean;
      },
    ) => {
      if (
        shouldBlockConcurrentStampRequest({
          preparing: preparingStampRef.current,
          stamping: isStamping,
        })
      ) {
        return;
      }
      preparingStampRef.current = true;
      setIsPreparingStamp(true);

      let handedOffToStamp = false;
      try {
        const loadResult = await fetchTripsForStamp({
          forceRefresh: options?.forceRefresh,
        });
        if (loadResult.status === "incomplete") {
          toast({
            variant: "error",
            title: stampCopy.errorTitle,
            description: stampCopy.tripLoadFailed,
          });
          return;
        }

        const tripsForPreflight = loadResult.trips;
        const preflight = runTripStopsPreflight(
          collectStopsFromTrips(tripsForPreflight),
        );

        if (!preflight.ready) {
          setPreflightResult(preflight);
          setPendingStampInvoiceId(invoiceId);
          setPreflightOpen(true);
          return;
        }

        setPreflightOpen(false);
        setPreflightResult(null);
        setPendingStampInvoiceId(invoiceId);
        handedOffToStamp = true;
        stamp(invoiceId);
      } finally {
        if (!handedOffToStamp) {
          releasePreparingStamp();
        }
      }
    },
    [fetchTripsForStamp, isStamping, releasePreparingStamp, stamp, toast],
  );

  const handleFiscalFixSuccess = useCallback(
    (result: PatchTripStopFiscalResult) => {
      // El toast de éxito implica PATCH OK; hay que refrescar paradas antes del
      // preflight o se reabre «Revisa el RFC…» con cache vieja (RFC aún vacío).
      applyPatchedStopToLocalTrips(result);

      if (
        resolvePostFiscalFixStampMode({
          enableAutoRestamp,
          pendingStampInvoiceId,
        }) === "requestStamp" &&
        pendingStampInvoiceId
      ) {
        void requestStamp(pendingStampInvoiceId, { forceRefresh: true });
      }
    },
    [
      applyPatchedStopToLocalTrips,
      enableAutoRestamp,
      pendingStampInvoiceId,
      requestStamp,
    ],
  );
  const activeFixStop = fixStopId ? stopsById.get(fixStopId) : undefined;
  const activeFixTrip = fixStopId ? resolveTripForStop(fixStopId) : null;

  const sheets: ReactNode = (
    <>
      {activeFixStop && activeFixTrip ? (
        <TripFiscalCorrectionSheet
          mode="apply-now"
          tripId={activeFixTrip.id}
          stop={activeFixStop}
          clientId={activeFixTrip.clientId}
          correctionKind={fixCorrectionKind}
          open={Boolean(fixStopId)}
          onOpenChange={(open) => {
            if (!open) {
              setFixStopId(null);
              setStampOverlayError(null);
            }
          }}
          submitLabel={fixSubmitLabel}
          overlayError={stampOverlayError}
          onSuccess={handleFiscalFixSuccess}
        />
      ) : null}

      <StopPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        stops={pickerStops}
        listMode={pickerListMode}
        onSelectStop={(stopId) =>
          openFixSheet(stopId, {
            pendingInvoiceId: pendingStampInvoiceId,
          })
        }
      />

      {preflightResult ? (
        <PreflightBlockerSheet
          open={preflightOpen}
          onOpenChange={setPreflightOpen}
          preflight={preflightResult}
          stopsById={stopsById}
          onFixStop={(stopId) =>
            openFixSheet(stopId, {
              submitLabel: tripFiscalCopy.fixSheet.submitStamp,
              pendingInvoiceId: pendingStampInvoiceId,
            })
          }
        />
      ) : null}
    </>
  );

  const isStampBusy = resolveIsStampBusy({
    isPreparingStamp,
    isStamping,
    preflightOpen,
  });

  return {
    sheets,
    isStamping,
    isStampBusy,
    requestStamp,
    openFixSheet,
    handleStampError,
    shouldShowFiscalWarningChipForStop: (stop: TripStop) =>
      trip ? shouldShowFiscalWarningChip(trip, stop) : false,
    shouldShowFiscalCorrectionChipForStop: (stop: TripStop) =>
      trip ? shouldShowFiscalCorrectionChip(trip, stop) : false,
  };
}
