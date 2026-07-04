import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { createTripStopAddressSchema } from "@boeltech/cfdi-domain/validadores/address";
import { isValidSatRfc } from "@boeltech/cfdi-domain";
import type { TripStop } from "@features/trips/domain";
import { TripStopAddressSingleLine } from "@features/trips/presentation/components/TripStopAddressLines";
import { parseClientAddressFormCreate } from "@shared/cfdi/addressPayloadBridge";
import {
  AddressPicker,
  addressSearchItemToTripStopAddress,
  type AddressSearchListItem,
  type SearchableOwnerType,
} from "@shared/ui/address-picker";
import AddressInput from "@shared/ui/address-input/AddressInput";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { FieldInlineError } from "@shared/ui/form/FieldInlineError";
import { FormFieldShell } from "@shared/ui/form/FormFieldShell";
import { getFieldErrorAriaProps } from "@shared/ui/form/fieldErrorAria";
import { FormValidationSummary } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { useCoordinatesPostalCodeWarning } from "@shared/geolocation/useCoordinatesPostalCodeWarning";
import { CoordinatesPostalCodeWarningAlert } from "@shared/geolocation/CoordinatesPostalCodeWarningAlert";
import { tripFiscalCopy } from "../../../copy/tripFiscalCopy";
import type { TripCorrectionFormEntry } from "@features/invoicing/presentation/validation/substitutionCorrectionsSchema";
import {
  buildInlineAddressParsePayload,
  buildInlineStopAddressDefaultValues,
  tripStopAddressDiffersFromInlinePayload,
  tripStopAddressDiffersFromSearchItem,
  type InlineStopAddressFormValues,
} from "@features/invoicing/presentation/components/fixStopAddressDeferredHelpers";
import {
  FiscalCorrectionReasonField,
  isFiscalCorrectionReasonValid,
} from "./FiscalCorrectionReasonField";

const defaultCopy = tripFiscalCopy.correctionSheet.address;
const defaultSavingLabel = tripFiscalCopy.correctionSheet.saving;
const DEFAULT_OWNER_TYPES: SearchableOwnerType[] = ["client", "tenant"];

type AddressMode = "swap" | "inline";

type InlineAddressFormValues = {
  stop_address: InlineStopAddressFormValues;
};

export type FiscalCorrectionAddressPayload = {
  stopAddress: NonNullable<TripCorrectionFormEntry["stop_address"]>;
  reason: string;
};

export type FiscalCorrectionAddressCopy =
  typeof tripFiscalCopy.correctionSheet.address;

export type FiscalCorrectionAddressSectionHandle = {
  submit: () => void;
};

export interface FiscalCorrectionAddressSectionProps {
  tripId: string;
  clientId: string | null | undefined;
  stop: TripStop;
  disabled?: boolean;
  idPrefix?: string;
  showHeader?: boolean;
  copy?: FiscalCorrectionAddressCopy;
  submitLabel?: string;
  savingLabel?: string;
  /** Cuando es `footer`, el botón primario vive en el SheetFooter del padre. */
  submitPlacement?: "inline" | "footer";
  onBusyChange?: (busy: boolean) => void;
  onSubmit: (payload: FiscalCorrectionAddressPayload) => void | Promise<void>;
  isSubmitting?: boolean;
}

export const FiscalCorrectionAddressSection = forwardRef<
  FiscalCorrectionAddressSectionHandle,
  FiscalCorrectionAddressSectionProps
>(function FiscalCorrectionAddressSection(
  {
    clientId,
    stop,
    disabled = false,
    idPrefix = "fiscal-address",
    showHeader = true,
    copy = defaultCopy,
    submitLabel = defaultCopy.saveCorrection,
    savingLabel = defaultSavingLabel,
    submitPlacement = "inline",
    onBusyChange,
    onSubmit,
    isSubmitting = false,
  },
  ref,
) {
  const [mode, setMode] = useState<AddressMode>("swap");
  const [selectedPrefill, setSelectedPrefill] =
    useState<AddressSearchListItem | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressValidationMessages, setAddressValidationMessages] = useState<string[]>([]);
  const [isSavingInline, setIsSavingInline] = useState(false);

  const inlineForm = useForm<InlineAddressFormValues>({
    defaultValues: {
      stop_address: buildInlineStopAddressDefaultValues(stop),
    },
  });

  const swapChanged = useMemo(
    () =>
      selectedPrefill != null &&
      tripStopAddressDiffersFromSearchItem(stop, selectedPrefill),
    [selectedPrefill, stop],
  );
  const swapRequiresClient = mode === "swap" && !clientId;
  const pickerRfcWarning = useMemo(() => {
    if (mode !== "swap" || !selectedPrefill) return null;
    const rfc = selectedPrefill.remitenteRfc?.trim();
    if (!rfc) return copy.preflightRfcMissing;
    if (!isValidSatRfc(rfc)) return copy.preflightRfcInvalid;
    return null;
  }, [mode, selectedPrefill]);

  const coordinatesPostalCodeWarning = useCoordinatesPostalCodeWarning(
    inlineForm.control,
    "stop_address",
    { enabled: mode === "inline" && !disabled },
  );

  const handleSaveSwap = async () => {
    if (!isFiscalCorrectionReasonValid(reason)) {
      setReasonError(copy.reasonTooShort);
      return;
    }
    if (!selectedPrefill) {
      setAddressError(copy.pickerRequired);
      return;
    }
    if (!swapChanged) {
      setAddressError(copy.addressUnchanged);
      return;
    }

    const payload = addressSearchItemToTripStopAddress(selectedPrefill);
    const parsed = createTripStopAddressSchema.safeParse(payload);
    if (!parsed.success) {
      setAddressError(copy.addressValidationFailed);
      return;
    }

    setReasonError(null);
    setAddressError(null);
    await onSubmit({
      stopAddress: parsed.data as NonNullable<TripCorrectionFormEntry["stop_address"]>,
      reason: reason.trim(),
    });
  };

  const handleSaveInline = async () => {
    if (!isFiscalCorrectionReasonValid(reason)) {
      setReasonError(copy.reasonTooShort);
      return;
    }
    setReasonError(null);
    setAddressValidationMessages([]);
    setIsSavingInline(true);

    try {
      const addressValues = inlineForm.getValues("stop_address");
      const parsed = await parseClientAddressFormCreate(
        buildInlineAddressParsePayload(stop, addressValues),
        { context: "trip_stop", requireCoordinates: false },
      );

      if (!parsed.ok) {
        const messages = [
          ...new Set(
            parsed.errors
              .map((error) => error.message?.trim())
              .filter((message): message is string => Boolean(message)),
          ),
        ];
        setAddressValidationMessages(
          messages.length > 0 ? messages : [copy.addressValidationFailed],
        );
        setAddressError(messages[0] ?? copy.addressValidationFailed);
        inlineForm.clearErrors("stop_address");
        for (const [field, message] of Object.entries(parsed.fieldErrors)) {
          inlineForm.setError(
            `stop_address.${field}` as Path<InlineAddressFormValues>,
            { type: "manual", message },
          );
        }
        return;
      }

      if (!tripStopAddressDiffersFromInlinePayload(stop, parsed.value)) {
        setAddressError(copy.addressUnchanged);
        return;
      }

      setAddressError(null);
      await onSubmit({
        stopAddress: parsed.value as NonNullable<TripCorrectionFormEntry["stop_address"]>,
        reason: reason.trim(),
      });
    } finally {
      setIsSavingInline(false);
    }
  };

  const reasonId = `${idPrefix}-reason`;
  const isBusy = isSubmitting || isSavingInline;
  const submitActionRef = useRef<() => void>(() => {});

  submitActionRef.current = () => {
    if (mode === "swap") {
      void handleSaveSwap();
    } else {
      void handleSaveInline();
    }
  };

  useEffect(() => {
    onBusyChange?.(isBusy);
  }, [isBusy, onBusyChange]);

  useImperativeHandle(
    ref,
    () => ({
      submit: () => submitActionRef.current(),
    }),
    [],
  );

  return (
    <div className="space-y-4">
      {showHeader ? (
        <div className="space-y-1">
          <TripStopAddressSingleLine
            stop={stop}
            className="text-sm text-muted-foreground"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "swap" ? "default" : "outline"}
          disabled={disabled}
          onClick={() => setMode("swap")}
        >
          {copy.swapLabel}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "inline" ? "default" : "outline"}
          disabled={disabled}
          onClick={() => setMode("inline")}
        >
          {copy.inlineLabel}
        </Button>
      </div>

      {mode === "swap" ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{copy.swapDescription}</p>
          {swapRequiresClient ? (
            <p className="text-sm text-muted-foreground">{copy.tripClientRequired}</p>
          ) : null}
          <AddressPicker
            value={selectedPrefill}
            onSelect={(item) => {
              setSelectedPrefill(item);
              setAddressError(null);
            }}
            onClear={() => {
              setSelectedPrefill(null);
              setAddressError(null);
            }}
            label={copy.pickerLabel}
            placeholder={copy.pickerPlaceholder}
            disabled={disabled || swapRequiresClient}
            defaultOwnerTypes={DEFAULT_OWNER_TYPES}
          />
          {addressError ? (
            <FieldInlineError fieldId={`${idPrefix}-picker`} message={addressError} />
          ) : null}
          {pickerRfcWarning ? (
            <Alert variant="warning">
              <AlertDescription>{pickerRfcWarning}</AlertDescription>
            </Alert>
          ) : null}
        </div>
      ) : (
        <>
          <Controller
            name="stop_address.locationName"
            control={inlineForm.control}
            render={({ field, fieldState }) => {
              const fieldId = `${idPrefix}-locationName`;
              const errorMessage = fieldState.error?.message;
              return (
                <FormFieldShell
                  fieldId={fieldId}
                  label={copy.locationNameLabel}
                  required
                  errorMessage={errorMessage}
                >
                  <Input
                    id={fieldId}
                    placeholder={copy.locationNamePlaceholder}
                    error={Boolean(errorMessage)}
                    disabled={disabled}
                    {...field}
                    value={field.value ?? ""}
                    {...getFieldErrorAriaProps(fieldId, errorMessage)}
                  />
                </FormFieldShell>
              );
            }}
          />
          <AddressInput
            control={inlineForm.control}
            setValue={inlineForm.setValue}
            namePrefix="stop_address"
            variant="carta-porte"
            formContext="tripStop"
            disabled={disabled}
          />
          {coordinatesPostalCodeWarning ? (
            <CoordinatesPostalCodeWarningAlert
              warning={coordinatesPostalCodeWarning}
              copy={copy}
            />
          ) : null}
          {addressError ? (
            <FieldInlineError fieldId={`${idPrefix}-inline`} message={addressError} />
          ) : null}
          {addressValidationMessages.length > 0 ? (
            <FormValidationSummary
              title={copy.addressValidationSummaryTitle}
              messages={addressValidationMessages}
            />
          ) : null}
        </>
      )}

      <FiscalCorrectionReasonField
        id={reasonId}
        value={reason}
        disabled={disabled}
        error={reasonError}
        label={copy.reasonLabel}
        onChange={(value) => {
          setReason(value);
          if (reasonError) setReasonError(null);
        }}
      />

      {submitPlacement === "inline" ? (
        <div className="flex justify-end">
          {mode === "swap" ? (
            <Button
              type="button"
              onClick={() => void handleSaveSwap()}
              disabled={disabled || swapRequiresClient || isSubmitting}
            >
              {isSubmitting ? savingLabel : submitLabel}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleSaveInline()}
              disabled={disabled || isSavingInline || isSubmitting}
            >
              {isSubmitting || isSavingInline ? savingLabel : submitLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
});
