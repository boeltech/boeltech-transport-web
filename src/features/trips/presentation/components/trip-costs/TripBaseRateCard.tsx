import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";

import { useUpdateTrip } from "@features/trips/application/hooks/trip/useUpdateTrip";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";

import {
  validateCostsStep,
  wizardHasContractingClient,
} from "../../pages/create/components/validation";
import { formatMxCurrency } from "../../pages/create/components/financialSummary";
import type { TripWizardExpenseLine } from "../../pages/create/components/tripWizardFinancialSnapshot";
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

function parseDraftBaseRate(draft: string): number | undefined {
  const trimmed = draft.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function TripBaseRateCard({
  tripId,
  baseRate,
  cfdiDocumentIntent,
  clientId,
  expenseLines,
  readOnly,
}: TripBaseRateCardProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState(() =>
    baseRate > 0 ? String(baseRate) : "",
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

  useEffect(() => {
    setDraft(baseRate > 0 ? String(baseRate) : "");
    setFieldError(null);
  }, [baseRate]);

  const baseRateRequired =
    cfdiDocumentIntent === "ingreso" && wizardHasContractingClient(clientId);

  const parsedDraft = parseDraftBaseRate(draft);
  const persistedValue = baseRate > 0 ? baseRate : undefined;
  const isDirty =
    (parsedDraft ?? undefined) !== persistedValue &&
    !(parsedDraft === undefined && persistedValue === undefined);

  const handleSave = async () => {
    setFieldError(null);

    const validation = validateCostsStep({
      baseRate: parsedDraft,
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
        data: { baseRate: parsedDraft ?? 0 },
      });
    } catch {
      // Toast en onError del mutation
    }
  };

  const handleCancel = () => {
    setDraft(baseRate > 0 ? String(baseRate) : "");
    setFieldError(null);
  };

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
              <Input
                id="trip-detail-base-rate"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
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
        )}
      </CardContent>
    </Card>
  );
}
