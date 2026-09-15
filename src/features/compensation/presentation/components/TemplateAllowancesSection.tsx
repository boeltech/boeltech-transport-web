import {
  Controller,
  type Control,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { Banknote, Plus, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { MoneyInput } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  FIXED_ALLOWANCE_PERIOD_LABELS,
  type FixedAllowanceType,
} from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";

const sheetCopy = compensationCopy.sheet;
const builderCopy = compensationCopy.builder;
const detailCopy = compensationCopy.templateDetail;

interface TemplateAllowancesSectionProps {
  control: Control<CompensationTemplateFormData>;
  setValue: UseFormSetValue<CompensationTemplateFormData>;
  register: UseFormRegister<CompensationTemplateFormData>;
  allowanceFields: { id: string }[];
  appendAllowance: UseFieldArrayAppend<CompensationTemplateFormData, "fixedAllowances">;
  removeAllowance: UseFieldArrayRemove;
  stepPrefix?: string;
  /** Léxico operativo + auto-label (default true). */
  operationalLexicon?: boolean;
}

function defaultLabelForType(type: FixedAllowanceType): string {
  return builderCopy.allowanceTypeLabels[type];
}

export function TemplateAllowancesSection({
  control,
  setValue,
  register,
  allowanceFields,
  appendAllowance,
  removeAllowance,
  stepPrefix = "2.",
  operationalLexicon = true,
}: TemplateAllowancesSectionProps) {
  const typeLabels = builderCopy.allowanceTypeLabels;
  const sectionTitle = operationalLexicon
    ? builderCopy.allowancesSectionTitle
    : detailCopy.allowancesTitle;
  const emptyLabel = operationalLexicon
    ? builderCopy.noAllowances
    : detailCopy.noAllowances;
  const addLabel = operationalLexicon
    ? sheetCopy.addFixedPayment
    : sheetCopy.addAllowance;

  return (
    <FormSectionCard
      title={
        stepPrefix.trim()
          ? `${stepPrefix} ${sectionTitle}`
          : sectionTitle
      }
      icon={<Banknote className="h-4 w-4" />}
      contentClassName="space-y-4"
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() =>
            appendAllowance({
              allowanceType: "meals",
              label: defaultLabelForType("meals"),
              amount: 500,
              period: "weekly",
              isMandatory: true,
            })
          }
        >
          {addLabel}
        </Button>
      }
    >
      {allowanceFields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        allowanceFields.map((field, index) => (
          <div key={field.id} className="rounded-lg border bg-muted/15 p-3 space-y-3">
            <Controller
              control={control}
              name={`fixedAllowances.${index}.allowanceType`}
              render={({ field: typeField }) => {
                const showLabelInput =
                  !operationalLexicon || typeField.value === "other";

                return (
                  <div
                    className={
                      showLabelInput
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                        : "grid grid-cols-1 gap-3"
                    }
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`allowance-type-${index}`}>
                        {sheetCopy.allowanceType}
                      </Label>
                      <Select
                        value={typeField.value}
                        onValueChange={(value) => {
                          const nextType = value as FixedAllowanceType;
                          typeField.onChange(nextType);
                          if (operationalLexicon && nextType !== "other") {
                            setValue(
                              `fixedAllowances.${index}.label`,
                              defaultLabelForType(nextType),
                              { shouldDirty: true },
                            );
                          }
                        }}
                      >
                        <SelectTrigger
                          id={`allowance-type-${index}`}
                          className="h-10"
                          aria-label={sheetCopy.allowanceType}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(typeLabels) as FixedAllowanceType[]).map((key) => (
                            <SelectItem key={key} value={key}>
                              {typeLabels[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!showLabelInput ? (
                        <input
                          type="hidden"
                          {...register(`fixedAllowances.${index}.label`)}
                        />
                      ) : null}
                    </div>

                    {showLabelInput ? (
                      <div className="space-y-1.5">
                        <Label htmlFor={`allowance-label-${index}`}>
                          {sheetCopy.allowanceLabel}
                        </Label>
                        <Input
                          id={`allowance-label-${index}`}
                          className="h-10"
                          placeholder={sheetCopy.allowanceLabel}
                          {...register(`fixedAllowances.${index}.label`)}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`allowance-amount-${index}`}>
                  {sheetCopy.allowanceAmount}
                </Label>
                <Controller
                  control={control}
                  name={`fixedAllowances.${index}.amount`}
                  render={({ field, fieldState }) => (
                    <MoneyInput
                      id={`allowance-amount-${index}`}
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      error={Boolean(fieldState.error)}
                      className="h-10"
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`allowance-period-${index}`}>
                  {sheetCopy.allowancePeriod}
                </Label>
                <Controller
                  control={control}
                  name={`fixedAllowances.${index}.period`}
                  render={({ field: periodField }) => (
                    <Select
                      value={periodField.value}
                      onValueChange={periodField.onChange}
                    >
                      <SelectTrigger
                        id={`allowance-period-${index}`}
                        className="h-10"
                        aria-label={sheetCopy.allowancePeriod}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FIXED_ALLOWANCE_PERIOD_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => removeAllowance(index)}
              >
                {sheetCopy.remove}
              </Button>
            </div>
          </div>
        ))
      )}
    </FormSectionCard>
  );
}
