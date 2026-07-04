import { useRef, useState } from "react";
import { usePatchStopFiscal } from "@features/trips/application/hooks/usePatchStopFiscal";
import type {
  PatchTripStopFiscalResult,
  TripStop,
} from "@features/trips/domain";
import type { TripCorrectionFormEntry } from "@features/invoicing/presentation/validation/substitutionCorrectionsSchema";
import { getStopTypeConfig } from "@features/trips/presentation/uiHelpers";
import { usePermissions } from "@shared/permissions";
import { useOverlayMutationFeedback, useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import {
  buildFixSheetInitialValues,
  formatStopLocation,
} from "./tripFiscalHelpers";
import {
  FiscalCorrectionRfcFields,
  useFiscalCorrectionRfcValidation,
} from "./sections/FiscalCorrectionRfcFields";
import {
  FiscalCorrectionAddressSection,
  type FiscalCorrectionAddressCopy,
  type FiscalCorrectionAddressPayload,
  type FiscalCorrectionAddressSectionHandle,
} from "./sections/FiscalCorrectionAddressSection";
import { isFiscalCorrectionReasonValid } from "./sections/FiscalCorrectionReasonField";
import { FiscalCorrectionStopContext } from "./sections/FiscalCorrectionStopContext";
import {
  FISCAL_CORRECTION_SHEET_BODY_CLASS,
  FISCAL_CORRECTION_SHEET_CONTENT_CLASS,
  FISCAL_CORRECTION_SHEET_FOOTER_CLASS,
  FISCAL_CORRECTION_SHEET_HEADER_CLASS,
  FISCAL_CORRECTION_SHEET_PRIMARY_BUTTON_CLASS,
} from "./fiscalCorrectionSheetLayout";

const copy = tripFiscalCopy.fixSheet;
const sheetCopy = tripFiscalCopy.correctionSheet;

export type TripFiscalCorrectionKind = "rfc" | "address";

export interface TripFiscalCorrectionSheetProps {
  mode: "apply-now" | "defer";
  tripId: string;
  stop: TripStop;
  clientId?: string | null;
  correctionKind?: TripFiscalCorrectionKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: PatchTripStopFiscalResult) => void;
  onDeferSave?: (entry: TripCorrectionFormEntry) => void;
  submitLabel?: string;
  addressCopy?: FiscalCorrectionAddressCopy;
  addressSubmitLabel?: string;
  overlayError?: string | null;
  canExecute?: boolean;
}

type TripFiscalCorrectionSheetFormProps = Omit<
  TripFiscalCorrectionSheetProps,
  "open"
>;

interface FiscalCorrectionSheetContentProps {
  stop: TripStop;
  tripId: string;
  clientId?: string | null;
  activeKind: TripFiscalCorrectionKind;
  setActiveKind: (kind: TripFiscalCorrectionKind) => void;
  rfc: string;
  nombre: string;
  reason: string;
  propagate: boolean;
  rfcTouched: boolean;
  reasonError: string | null;
  canExecuteStopFiscal: boolean;
  canExecuteAddress: boolean;
  displayedError: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  addressCopy?: FiscalCorrectionAddressCopy;
  addressSubmitLabel?: string;
  onOpenChange: (open: boolean) => void;
  onRfcChange: (value: string) => void;
  onNombreChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onPropagateChange: (value: boolean) => void;
  onRfcBlur: () => void;
  onReasonBlur: () => void;
  onReasonErrorChange: (value: string | null) => void;
  onRfcSubmit: () => void;
  onAddressSubmit: (payload: FiscalCorrectionAddressPayload) => void | Promise<void>;
}

function FiscalCorrectionSheetContent({
  stop,
  tripId,
  clientId,
  activeKind,
  setActiveKind,
  rfc,
  nombre,
  reason,
  propagate,
  rfcTouched,
  reasonError,
  canExecuteStopFiscal,
  canExecuteAddress,
  displayedError,
  isSubmitting,
  submitLabel,
  addressCopy,
  addressSubmitLabel,
  onOpenChange,
  onRfcChange,
  onNombreChange,
  onReasonChange,
  onPropagateChange,
  onRfcBlur,
  onReasonBlur,
  onReasonErrorChange,
  onRfcSubmit,
  onAddressSubmit,
}: FiscalCorrectionSheetContentProps) {
  const addressSectionRef = useRef<FiscalCorrectionAddressSectionHandle>(null);
  const [addressBusy, setAddressBusy] = useState(false);

  const stopTypeLabel = (Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType])
    .map((type) => getStopTypeConfig(type).label)
    .join(" · ");

  const canEditActive =
    activeKind === "rfc" ? canExecuteStopFiscal : canExecuteAddress;
  const activeTabHint =
    activeKind === "rfc" ? sheetCopy.tabRfcHint : sheetCopy.tabAddressHint;
  const activeNoPermission =
    activeKind === "rfc" ? sheetCopy.noPermissionRfc : sheetCopy.noPermissionAddress;
  const addressPrimaryLabel =
    addressSubmitLabel ?? tripFiscalCopy.correctionSheet.address.saveCorrection;
  const footerPrimaryLabel =
    activeKind === "rfc" ? submitLabel : addressPrimaryLabel;
  const footerPrimaryBusy =
    activeKind === "rfc" ? isSubmitting : isSubmitting || addressBusy;
  const footerPrimaryDisabled =
    activeKind === "rfc"
      ? !canExecuteStopFiscal || isSubmitting
      : !canExecuteAddress || isSubmitting || addressBusy;

  const handleFooterPrimary = () => {
    if (activeKind === "rfc") {
      onRfcSubmit();
      return;
    }
    addressSectionRef.current?.submit();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SheetHeader className={FISCAL_CORRECTION_SHEET_HEADER_CLASS}>
        <SheetTitle className="pr-8">{sheetCopy.title}</SheetTitle>
        <SheetDescription className="text-muted-foreground">
          {sheetCopy.subtitle(stop.sequenceOrder, stopTypeLabel, formatStopLocation(stop))}
        </SheetDescription>
      </SheetHeader>

      <div className={FISCAL_CORRECTION_SHEET_BODY_CLASS}>
        {displayedError ? (
          <Alert variant="destructive">
            <AlertTitle>{tripFiscalCopy.stamp.errorTitle}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {displayedError}
            </AlertDescription>
          </Alert>
        ) : null}

        <FiscalCorrectionStopContext stop={stop} />

        {!canEditActive ? (
          <p className="text-sm text-muted-foreground">{activeNoPermission}</p>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeKind === "rfc" ? "default" : "outline"}
              onClick={() => setActiveKind("rfc")}
            >
              {sheetCopy.tabRfc}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeKind === "address" ? "default" : "outline"}
              onClick={() => setActiveKind("address")}
            >
              {sheetCopy.tabAddress}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{activeTabHint}</p>
        </div>

        {activeKind === "rfc" ? (
          <FiscalCorrectionRfcFields
            stop={stop}
            rfc={rfc}
            nombre={nombre}
            reason={reason}
            propagate={propagate}
            rfcTouched={rfcTouched}
            reasonError={reasonError}
            disabled={!canExecuteStopFiscal}
            onRfcChange={onRfcChange}
            onNombreChange={onNombreChange}
            onReasonChange={onReasonChange}
            onPropagateChange={onPropagateChange}
            onRfcBlur={onRfcBlur}
            onReasonBlur={onReasonBlur}
            onReasonErrorChange={onReasonErrorChange}
          />
        ) : (
          <FiscalCorrectionAddressSection
            ref={addressSectionRef}
            tripId={tripId}
            clientId={clientId}
            stop={stop}
            disabled={!canExecuteAddress}
            showHeader={false}
            isSubmitting={isSubmitting}
            copy={addressCopy}
            submitLabel={addressSubmitLabel}
            submitPlacement="footer"
            onBusyChange={setAddressBusy}
            onSubmit={onAddressSubmit}
          />
        )}
      </div>

      <SheetFooter className={FISCAL_CORRECTION_SHEET_FOOTER_CLASS}>
        <Button
          type="button"
          variant="outline"
          className={FISCAL_CORRECTION_SHEET_PRIMARY_BUTTON_CLASS}
          onClick={() => onOpenChange(false)}
          disabled={footerPrimaryBusy}
        >
          {sheetCopy.close}
        </Button>
        <Button
          type="button"
          className={FISCAL_CORRECTION_SHEET_PRIMARY_BUTTON_CLASS}
          onClick={handleFooterPrimary}
          disabled={footerPrimaryDisabled}
        >
          {footerPrimaryBusy ? sheetCopy.saving : footerPrimaryLabel}
        </Button>
      </SheetFooter>
    </div>
  );
}

function useFiscalCorrectionFieldState(stop: TripStop, correctionKind: TripFiscalCorrectionKind) {
  const initial = buildFixSheetInitialValues(stop);
  const [activeKind, setActiveKind] = useState<TripFiscalCorrectionKind>(correctionKind);
  const [rfc, setRfc] = useState(initial.rfc);
  const [nombre, setNombre] = useState(initial.nombre);
  const [reason, setReason] = useState("");
  const [propagate, setPropagate] = useState(false);
  const [rfcTouched, setRfcTouched] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const { normalizedRfc, canSubmit } = useFiscalCorrectionRfcValidation(
    rfc,
    reason,
    rfcTouched,
  );

  return {
    activeKind,
    setActiveKind,
    rfc,
    setRfc,
    nombre,
    setNombre,
    reason,
    setReason,
    propagate,
    setPropagate,
    rfcTouched,
    setRfcTouched,
    reasonError,
    setReasonError,
    normalizedRfc,
    canSubmit,
  };
}

function TripFiscalCorrectionDeferForm({
  tripId,
  stop,
  clientId,
  correctionKind = "rfc",
  onOpenChange,
  onDeferSave,
  submitLabel = copy.submitStamp,
  addressCopy,
  addressSubmitLabel,
  overlayError,
  canExecute: canExecuteOverride,
}: TripFiscalCorrectionSheetFormProps) {
  const { hasPermission } = usePermissions();
  const canExecuteStopFiscal =
    canExecuteOverride ?? hasPermission("trips_stops_fiscal", "execute");
  const canExecuteAddress =
    canExecuteOverride ?? hasPermission("trips_fiscal_edit", "execute");

  const fields = useFiscalCorrectionFieldState(stop, correctionKind);

  const handleRfcSubmit = () => {
    if (!fields.canSubmit) {
      if (!isFiscalCorrectionReasonValid(fields.reason)) {
        fields.setReasonError(copy.reasonTooShort);
      }
      fields.setRfcTouched(true);
      return;
    }
    fields.setReasonError(null);

    onDeferSave?.({
      trip_id: tripId,
      stop_id: stop.id,
      rfc_remitente_destinatario: fields.normalizedRfc,
      nombre_remitente_destinatario: fields.nombre.trim() || undefined,
      reason: fields.reason.trim(),
      propagate_to_client: fields.propagate,
    });
    onOpenChange(false);
  };

  const handleAddressSubmit = async (payload: FiscalCorrectionAddressPayload) => {
    onDeferSave?.({
      trip_id: tripId,
      stop_id: stop.id,
      stop_address: payload.stopAddress,
      reason: payload.reason,
    });
    onOpenChange(false);
  };

  return (
    <FiscalCorrectionSheetContent
      stop={stop}
      tripId={tripId}
      clientId={clientId}
      activeKind={fields.activeKind}
      setActiveKind={fields.setActiveKind}
      rfc={fields.rfc}
      nombre={fields.nombre}
      reason={fields.reason}
      propagate={fields.propagate}
      rfcTouched={fields.rfcTouched}
      reasonError={fields.reasonError}
      canExecuteStopFiscal={canExecuteStopFiscal}
      canExecuteAddress={canExecuteAddress}
      displayedError={overlayError ?? null}
      isSubmitting={false}
      submitLabel={submitLabel}
      addressCopy={addressCopy}
      addressSubmitLabel={addressSubmitLabel}
      onOpenChange={onOpenChange}
      onRfcChange={(value) => {
        fields.setRfc(value);
        if (!fields.rfcTouched) fields.setRfcTouched(true);
      }}
      onNombreChange={fields.setNombre}
      onReasonChange={fields.setReason}
      onPropagateChange={fields.setPropagate}
      onRfcBlur={() => fields.setRfcTouched(true)}
      onReasonBlur={() => {
        if (
          fields.reason.trim().length > 0 &&
          !isFiscalCorrectionReasonValid(fields.reason)
        ) {
          fields.setReasonError(copy.reasonTooShort);
        }
      }}
      onReasonErrorChange={fields.setReasonError}
      onRfcSubmit={handleRfcSubmit}
      onAddressSubmit={handleAddressSubmit}
    />
  );
}

function TripFiscalCorrectionApplyNowForm({
  tripId,
  stop,
  clientId,
  correctionKind = "rfc",
  onOpenChange,
  onSuccess,
  submitLabel = copy.submitStamp,
  addressCopy,
  addressSubmitLabel,
  overlayError,
  canExecute: canExecuteOverride,
}: TripFiscalCorrectionSheetFormProps) {
  const { toast } = useToast();
  const { submissionError, showOverlayError, clearOverlayError } =
    useOverlayMutationFeedback({
      errorTitle: tripFiscalCopy.stamp.errorTitle,
      seeInlineCopy: tripFiscalCopy.overlayErrorSeeInline,
      toast,
    });
  const displayedError = submissionError ?? overlayError ?? null;
  const { hasPermission } = usePermissions();
  const canExecuteStopFiscal =
    canExecuteOverride ?? hasPermission("trips_stops_fiscal", "execute");
  const canExecuteAddress =
    canExecuteOverride ?? hasPermission("trips_fiscal_edit", "execute");

  const fields = useFiscalCorrectionFieldState(stop, correctionKind);

  const mutation = usePatchStopFiscal(tripId, stop.id, {
    onSuccess: (result) => {
      toast({
        variant: "success",
        title: copy.successTitle,
        description: result.clientUpdated ? copy.successClientUpdated : undefined,
      });
      onSuccess?.(result);
      onOpenChange(false);
    },
    onError: (error) => {
      showOverlayError(getErrorMessage(error));
    },
  });

  const handleRfcSubmit = () => {
    if (!fields.canSubmit) {
      if (!isFiscalCorrectionReasonValid(fields.reason)) {
        fields.setReasonError(copy.reasonTooShort);
      }
      fields.setRfcTouched(true);
      return;
    }
    fields.setReasonError(null);
    clearOverlayError();

    mutation.mutate({
      rfcRemitenteDestinatario: fields.normalizedRfc,
      nombreRemitenteDestinatario: fields.nombre.trim() || undefined,
      reason: fields.reason.trim(),
      propagateToClient: fields.propagate,
    });
  };

  const handleAddressSubmit = async (payload: FiscalCorrectionAddressPayload) => {
    clearOverlayError();
    await mutation.mutateAsync({
      stopAddress: payload.stopAddress,
      reason: payload.reason,
    });
  };

  return (
    <FiscalCorrectionSheetContent
      stop={stop}
      tripId={tripId}
      clientId={clientId}
      activeKind={fields.activeKind}
      setActiveKind={fields.setActiveKind}
      rfc={fields.rfc}
      nombre={fields.nombre}
      reason={fields.reason}
      propagate={fields.propagate}
      rfcTouched={fields.rfcTouched}
      reasonError={fields.reasonError}
      canExecuteStopFiscal={canExecuteStopFiscal}
      canExecuteAddress={canExecuteAddress}
      displayedError={displayedError}
      isSubmitting={mutation.isPending}
      submitLabel={submitLabel}
      addressCopy={addressCopy}
      addressSubmitLabel={addressSubmitLabel}
      onOpenChange={onOpenChange}
      onRfcChange={(value) => {
        fields.setRfc(value);
        if (!fields.rfcTouched) fields.setRfcTouched(true);
      }}
      onNombreChange={fields.setNombre}
      onReasonChange={fields.setReason}
      onPropagateChange={fields.setPropagate}
      onRfcBlur={() => fields.setRfcTouched(true)}
      onReasonBlur={() => {
        if (
          fields.reason.trim().length > 0 &&
          !isFiscalCorrectionReasonValid(fields.reason)
        ) {
          fields.setReasonError(copy.reasonTooShort);
        }
      }}
      onReasonErrorChange={fields.setReasonError}
      onRfcSubmit={handleRfcSubmit}
      onAddressSubmit={handleAddressSubmit}
    />
  );
}

function TripFiscalCorrectionSheetForm(props: TripFiscalCorrectionSheetFormProps) {
  if (props.mode === "defer") {
    return <TripFiscalCorrectionDeferForm {...props} />;
  }
  return <TripFiscalCorrectionApplyNowForm {...props} />;
}

export function TripFiscalCorrectionSheet({
  open,
  correctionKind = "rfc",
  ...props
}: TripFiscalCorrectionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className={FISCAL_CORRECTION_SHEET_CONTENT_CLASS}>
        {open ? (
          <TripFiscalCorrectionSheetForm
            key={`${props.stop.id}-${correctionKind}`}
            correctionKind={correctionKind}
            {...props}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
