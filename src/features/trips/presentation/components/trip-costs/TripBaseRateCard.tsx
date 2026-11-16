import { useState } from "react";

import { usePatchTripBaseRate } from "@features/trips/application";
import { useToast } from "@shared/hooks";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { FormFieldShell, MoneyInput, getFieldErrorAriaProps } from "@shared/ui/form";

import {
  validateCostsStep,
  wizardHasContractingClient,
} from "../../pages/create/components/validation";
import { formatMxCurrency, type TripWizardExpenseLine } from "../trip-financial";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

export interface TripBaseRateCardProps {
  tripId: string;
  baseRate: number;
  cfdiDocumentIntent: "ingreso" | "traslado";
  clientId?: string;
  expenseLines: TripWizardExpenseLine[];
  readOnly: boolean;
  /** PD-D: Facturado vs Tarifa registrada en completed. */
  incomeSourceLabel?: string | null;
}

function TripBaseRateCardEditor({
  tripId,
  baseRate,
  cfdiDocumentIntent,
  clientId,
  expenseLines,
  onCancel,
}: Omit<TripBaseRateCardProps, "readOnly" | "incomeSourceLabel"> & {
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<number | undefined>(
    baseRate > 0 ? baseRate : undefined,
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const patchBaseRate = usePatchTripBaseRate(tripId, {
    onSuccess: () => {
      toast({ title: copy.toast.baseRateUpdated, variant: "success" });
      onCancel();
    },
    onError: (error) => {
      toast({
        title: copy.toast.baseRateSaveError,
        description: error.message,
        variant: "error",
      });
    },
  });

  const baseRateRequired =
    cfdiDocumentIntent === "ingreso" && wizardHasContractingClient(clientId);

  const persistedValue = baseRate > 0 ? baseRate : undefined;
  const isDirty =
    (draft ?? undefined) !== persistedValue &&
    !(draft === undefined && persistedValue === undefined);

  const handleSave = async () => {
    setFieldError(null);

    const validation = validateCostsStep({
      baseRate: draft,
      expenses: expenseLines,
      cfdiDocumentIntent,
      clientId,
    });

    if (!validation.isValid) {
      setFieldError(validation.message ?? copy.error.invalidBaseRate);
      return;
    }

    if (validation.warning) {
      toast({
        title: copy.toast.baseRateSavedWithWarning,
        description: validation.warning,
        variant: "warning",
      });
    }

    try {
      await patchBaseRate.mutateAsync(draft ?? 0);
    } catch {
      // Toast en onError del mutation
    }
  };

  const handleCancel = () => {
    setDraft(baseRate > 0 ? baseRate : undefined);
    setFieldError(null);
    onCancel();
  };

  return (
    <div className="space-y-4">
      <FormFieldShell
        fieldId="trip-detail-base-rate"
        className="max-w-sm"
        label={copy.label.baseRateInput}
        required={baseRateRequired}
        description={
          cfdiDocumentIntent === "traslado"
            ? copy.hint.baseRateTraslado
            : baseRateRequired
              ? copy.hint.baseRateIngresoRequired
              : copy.hint.baseRateIngresoOptional
        }
        errorMessage={fieldError ?? undefined}
      >
        <MoneyInput
          id="trip-detail-base-rate"
          value={draft}
          onValueChange={setDraft}
          disabled={patchBaseRate.isPending}
          error={Boolean(fieldError)}
          {...getFieldErrorAriaProps(
            "trip-detail-base-rate",
            fieldError ?? undefined,
          )}
        />
      </FormFieldShell>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void handleSave()}
          disabled={patchBaseRate.isPending || !isDirty}
        >
          {patchBaseRate.isPending ? copy.action.savingBaseRate : copy.action.saveBaseRate}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={patchBaseRate.isPending}
        >
          {copy.action.cancel}
        </Button>
      </div>
    </div>
  );
}

function baseRateHint(
  cfdiDocumentIntent: "ingreso" | "traslado",
  clientId: string | undefined,
): string {
  if (cfdiDocumentIntent === "traslado") return copy.hint.baseRateTraslado;
  if (wizardHasContractingClient(clientId)) {
    return copy.hint.baseRateIngresoRequired;
  }
  return copy.hint.baseRateIngresoOptional;
}

export function TripBaseRateCard({
  tripId,
  baseRate,
  cfdiDocumentIntent,
  clientId,
  expenseLines,
  readOnly,
  incomeSourceLabel,
}: TripBaseRateCardProps) {
  const [editing, setEditing] = useState(false);
  const showEditor = !readOnly && editing;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {copy.section.baseRate}
          {incomeSourceLabel ? (
            <Badge variant="neutral" tone="soft" className="text-xs font-medium">
              {incomeSourceLabel}
            </Badge>
          ) : null}
        </CardTitle>
        {!readOnly && !editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
          >
            {copy.action.edit}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {showEditor ? (
          <TripBaseRateCardEditor
            key={baseRate}
            tripId={tripId}
            baseRate={baseRate}
            cfdiDocumentIntent={cfdiDocumentIntent}
            clientId={clientId}
            expenseLines={expenseLines}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="space-y-2">
            <InfoRow
              variant="inline"
              label={copy.label.baseRate}
              value={formatMxCurrency(baseRate)}
            />
            <p className="text-xs text-muted-foreground">
              {baseRateHint(cfdiDocumentIntent, clientId)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
