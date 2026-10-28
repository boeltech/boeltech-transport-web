import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  classifyGenericRfc,
  GENERIC_RECEIVER_CFDI_USAGE,
  GENERIC_RECEIVER_TAX_REGIME,
  GENERIC_RFC_FOREIGN,
  type StopRfcPreflightResult,
} from "@boeltech/cfdi-domain";
import {
  useStampInvoice,
  useUpdateInvoice,
} from "@features/invoicing/application";
import {
  resolveGenericReceiverAdjustment,
  type InvoiceTripRef,
} from "@features/invoicing/domain";
import { createGetTripByIdUseCase } from "@features/trips/application";
import {
  tripQueryKeys,
  type PatchTripStopFiscalResult,
  type Trip,
  type TripStop,
} from "@features/trips/domain";
import { tripRepository } from "@features/trips/infrastructure";
import {
  parseInvalidRfcAtStopDetails,
  type InvalidRfcAtStopCandidate,
} from "@shared/api/errors/invalidRfcAtStopError";
import {
  getErrorMessage,
  isApiError,
  RECEIVER_GENERIC_RFC_FISCAL_MISMATCH_CODE,
} from "@shared/api/interceptors/error-handler";
import { useToast } from "@shared/hooks";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  buildOverlayErrorToastDescription,
  isInlineOverlayError,
} from "@shared/utils/overlayErrorFeedback";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import { TripFiscalCorrectionSheet } from "./TripFiscalCorrectionSheet";
import { PreflightBlockerSheet } from "./PreflightBlockerSheet";
import {
  GenericReceiverStampDialog,
  type GenericReceiverStampDialogState,
} from "./GenericReceiverStampDialog";
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
  /** Si se define, reemplaza el toast de éxito por defecto al timbrar. */
  onStampSuccessToast?: () => void;
  getStampErrorDescription?: (error: unknown) => string;
  /** Receptor de la factura a timbrar; habilita el ajuste previo para RFC genérico. */
  invoiceReceiver?: {
    receiverRfc?: string | null;
    receiverTaxRegime?: string | null;
    cfdiUsage?: string | null;
  } | null;
};

export function useTripFiscalSheets(options: UseTripFiscalSheetsOptions = {}) {
  const {
    trip,
    invoiceTripRefs = [],
    enableAutoRestamp = false,
    onStampSuccess,
    onStampSuccessToast,
    getStampErrorDescription = describeStampApiError,
    invoiceReceiver,
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
  /** Candidatos API (`ambiguous`); null = fallback v1 (invalid-only / all-stops). */
  const [pickerCandidates, setPickerCandidates] = useState<
    InvalidRfcAtStopCandidate[] | null
  >(null);
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
  /** D5: error PAC largo sin sheet abierto — panel persistente en página. */
  const [stampPageError, setStampPageError] = useState<string | null>(null);
  const [isPreparingStamp, setIsPreparingStamp] = useState(false);
  const preparingStampRef = useRef(false);
  const [genericReceiverDialog, setGenericReceiverDialog] =
    useState<GenericReceiverStampDialogState | null>(null);
  const [genericReceiverError, setGenericReceiverError] = useState<
    string | null
  >(null);
  const { mutate: updateInvoice, isPending: isAdjustingReceiver } =
    useUpdateInvoice();

  const releasePreparingStamp = useCallback(() => {
    preparingStampRef.current = false;
    setIsPreparingStamp(false);
  }, []);

  const { mutate: stamp, isPending: isStamping } = useStampInvoice({
    onSuccess: () => {
      setPendingStampInvoiceId(null);
      setStampPageError(null);
      releasePreparingStamp();
      if (onStampSuccessToast) {
        onStampSuccessToast();
      } else {
        toast({ variant: "success", title: "Factura timbrada exitosamente" });
      }
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
    if (pickerCandidates && pickerCandidates.length > 0) {
      const ordered: TripStop[] = [];
      for (const candidate of pickerCandidates) {
        const stop = stopsById.get(candidate.stopId);
        if (stop) ordered.push(stop);
      }
      return ordered;
    }
    if (invalidPickerStops.length > 0) {
      return invalidPickerStops;
    }
    return [...allStops].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [allStops, invalidPickerStops, pickerCandidates, stopsById]);

  const pickerListMode =
    pickerCandidates && pickerCandidates.length > 0
      ? "candidates"
      : invalidPickerStops.length > 0
        ? "invalid-only"
        : "all-stops-fallback";

  const openPicker = useCallback(
    (candidates: InvalidRfcAtStopCandidate[] | null = null) => {
      setPickerCandidates(candidates);
      setPickerOpen(true);
    },
    [],
  );

  const handlePickerOpenChange = useCallback((open: boolean) => {
    setPickerOpen(open);
    if (!open) setPickerCandidates(null);
  }, []);

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
      if (
        invoiceId &&
        isApiError(error) &&
        error.code === RECEIVER_GENERIC_RFC_FISCAL_MISMATCH_CODE
      ) {
        setPendingStampInvoiceId(invoiceId);
        setGenericReceiverError(null);
        setGenericReceiverDialog({
          mode: "error",
          invoiceId,
          kind:
            classifyGenericRfc(invoiceReceiver?.receiverRfc) ??
            (error.message.includes(GENERIC_RFC_FOREIGN)
              ? "foreign"
              : "national"),
          message: error.message,
        });
        return;
      }

      const parsed = parseInvalidRfcAtStopDetails(error);
      if (parsed) {
        if (invoiceId) setPendingStampInvoiceId(invoiceId);
        const pendingInvoiceId = invoiceId ?? pendingStampInvoiceId;

        // identified / legado con stopId: toast Corregir esta parada (v1).
        if (parsed.stopId) {
          toast({
            variant: "destructive",
            title: stampCopy.errorTitle,
            description: stampCopy.invalidRfcDescription(
              parsed.stopOrder != null
                ? toFiscalStopDisplayOrder(parsed.stopOrder)
                : null,
            ),
            action: {
              label: stampCopy.fixAction,
              onClick: () =>
                openFixSheet(parsed.stopId!, {
                  pendingInvoiceId,
                }),
            },
          });
          return;
        }

        // Ambiguous con un solo candidato: atajo UX al sheet (contrato sigue ambiguous).
        if (
          parsed.resolution === "ambiguous" &&
          parsed.candidateStops.length === 1
        ) {
          const only = parsed.candidateStops[0]!;
          openFixSheet(only.stopId, { pendingInvoiceId });
          return;
        }

        // Ambiguous con ≥2 candidatos: picker solo esas paradas.
        if (
          parsed.resolution === "ambiguous" &&
          parsed.candidateStops.length >= 2
        ) {
          openPicker(parsed.candidateStops);
          return;
        }

        // unknown / sin candidatos / legado sin resolution → fallback v1.
        openPicker(null);
        return;
      }

      const message = getStampErrorDescription(error);
      const hasInlineOverlay = Boolean(fixStopId);
      if (hasInlineOverlay) {
        setStampOverlayError(message);
        setStampPageError(null);
        toast({
          variant: "error",
          title: stampCopy.errorTitle,
          description: buildOverlayErrorToastDescription(
            message,
            tripFiscalCopy.overlayErrorSeeInline,
          ),
        });
        return;
      }

      // D5: sin sheet — error largo → panel persistente + toast breve (no dump PAC).
      if (isInlineOverlayError(message)) {
        setStampPageError(message);
        toast({
          variant: "error",
          title: stampCopy.errorTitle,
          description: tripFiscalCopy.stampPageErrorSeeInline,
        });
        return;
      }

      setStampPageError(null);
      toast({
        variant: "error",
        title: stampCopy.errorTitle,
        description: message,
      });
    },
    [
      fixStopId,
      getStampErrorDescription,
      invoiceReceiver?.receiverRfc,
      openFixSheet,
      openPicker,
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
      setStampPageError(null);

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

        const receiverAdjustment = invoiceReceiver
          ? resolveGenericReceiverAdjustment({
              receiverRfc: invoiceReceiver.receiverRfc,
              receiverTaxRegime: invoiceReceiver.receiverTaxRegime,
              cfdiUsage: invoiceReceiver.cfdiUsage,
            })
          : null;
        if (receiverAdjustment && receiverAdjustment.changes.length > 0) {
          setGenericReceiverError(null);
          setGenericReceiverDialog({
            mode: "preflight",
            invoiceId,
            kind: receiverAdjustment.kind,
            receiverRfc: invoiceReceiver?.receiverRfc?.trim().toUpperCase() ?? "",
            changes: receiverAdjustment.changes,
          });
          return;
        }

        handedOffToStamp = true;
        stamp(invoiceId);
      } finally {
        if (!handedOffToStamp) {
          releasePreparingStamp();
        }
      }
    },
    [
      fetchTripsForStamp,
      invoiceReceiver,
      isStamping,
      releasePreparingStamp,
      stamp,
      toast,
    ],
  );

  const closeGenericReceiverDialog = useCallback(() => {
    setGenericReceiverDialog(null);
    setGenericReceiverError(null);
  }, []);

  const confirmGenericReceiverAdjustment = useCallback(() => {
    const target = genericReceiverDialog;
    if (!target) return;
    setGenericReceiverError(null);
    updateInvoice(
      {
        id: target.invoiceId,
        payload: {
          receiverTaxRegime: GENERIC_RECEIVER_TAX_REGIME,
          cfdiUsage: GENERIC_RECEIVER_CFDI_USAGE,
        },
      },
      {
        onSuccess: () => {
          setGenericReceiverDialog(null);
          setPendingStampInvoiceId(target.invoiceId);
          stamp(target.invoiceId);
        },
        onError: (error) => {
          setGenericReceiverError(getErrorMessage(error));
        },
      },
    );
  }, [genericReceiverDialog, stamp, updateInvoice]);

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
      {stampPageError ? (
        <div
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-lg sm:inset-x-auto sm:left-auto sm:right-4"
          role="status"
        >
          <Alert variant="destructive" className="shadow-lg">
            <AlertTitle>{stampCopy.errorTitle}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {stampPageError}
            </AlertDescription>
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setStampPageError(null)}
              >
                {tripFiscalCopy.stampPageErrorDismiss}
              </Button>
            </div>
          </Alert>
        </div>
      ) : null}

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
        onOpenChange={handlePickerOpenChange}
        stops={pickerStops}
        listMode={pickerListMode}
        candidates={pickerCandidates ?? undefined}
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

      <GenericReceiverStampDialog
        state={genericReceiverDialog}
        isSubmitting={isAdjustingReceiver}
        submitError={genericReceiverError}
        onConfirm={confirmGenericReceiverAdjustment}
        onCancel={closeGenericReceiverDialog}
      />
    </>
  );

  const isStampBusy =
    resolveIsStampBusy({
      isPreparingStamp,
      isStamping,
      preflightOpen,
      fixSheetOpen: fixStopId != null,
      pickerOpen,
    }) ||
    genericReceiverDialog != null ||
    isAdjustingReceiver;

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
