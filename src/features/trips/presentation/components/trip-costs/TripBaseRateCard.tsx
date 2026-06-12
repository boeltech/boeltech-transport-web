import { useState } from "react";
import { DollarSign } from "lucide-react";

import { useUpdateTrip } from "@features/trips/application";
import { useToast } from "@shared/hooks";
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
}

function TripBaseRateCardEditor({
  tripId,
  baseRate,
  cfdiDocumentIntent,
  clientId,
  expenseLines,
}: Omit<TripBaseRateCardProps, "readOnly">) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<number | undefined>(
    baseRate > 0 ? baseRate : undefined,
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const updateTrip = useUpdateTrip({
    onSuccess: () => {
      toast({ title: copy.toast.baseRateUpdated, variant: "success" });
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
      await updateTrip.mutateAsync({
        id: tripId,
        data: { baseRate: draft ?? 0 },
      });
    } catch {
      // Toast en onError del mutation
    }
  };

  const handleCancel = () => {
    setDraft(baseRate > 0 ? baseRate : undefined);
    setFieldError(null);
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
          disabled={updateTrip.isPending}
          error={Boolean(fieldError)}
          {...getFieldErrorAriaProps(
            "trip-detail-base-rate",
            fieldError ?? undefined,
          )}
        />
      </FormFieldShell>
      {isDirty ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={updateTrip.isPending}
          >
            {updateTrip.isPending ? copy.action.savingBaseRate : copy.action.saveBaseRate}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateTrip.isPending}
          >
            {copy.action.cancel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function TripBaseRateCard({
  tripId,
  baseRate,
  cfdiDocumentIntent,
  clientId,
  expenseLines,
  readOnly,
}: TripBaseRateCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 shrink-0" />
          {copy.section.baseRate}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {readOnly ? (
          <InfoRow
            variant="inline"
            label={copy.label.baseRate}
            value={formatMxCurrency(baseRate)}
          />
        ) : (
          <TripBaseRateCardEditor
            key={baseRate}
            tripId={tripId}
            baseRate={baseRate}
            cfdiDocumentIntent={cfdiDocumentIntent}
            clientId={clientId}
            expenseLines={expenseLines}
          />
        )}
      </CardContent>
    </Card>
  );
}
