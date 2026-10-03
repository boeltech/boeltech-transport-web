import {
  Controller,
  useWatch,
  type Control,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { MinusCircle, Plus, Trash2 } from "lucide-react";
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
  type TemplateDeductionType,
} from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";
import { describeDeductionProse } from "../utils/simulateCompensation";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";

const sheetCopy = compensationCopy.sheet;
const builderCopy = compensationCopy.builder;
const detailCopy = compensationCopy.templateDetail;

interface TemplateDeductionsSectionProps {
  control: Control<CompensationTemplateFormData>;
  register: UseFormRegister<CompensationTemplateFormData>;
  setValue: UseFormSetValue<CompensationTemplateFormData>;
  deductionFields: { id: string }[];
  appendDeduction: UseFieldArrayAppend<CompensationTemplateFormData, "deductions">;
  removeDeduction: UseFieldArrayRemove;
  stepPrefix?: string;
  operationalLexicon?: boolean;
}

function defaultLabelForType(type: TemplateDeductionType): string {
  return builderCopy.deductionTypeLabels[type];
}

export function TemplateDeductionsSection({
  control,
  register,
  setValue,
  deductionFields,
  appendDeduction,
  removeDeduction,
  stepPrefix = "",
  operationalLexicon = true,
}: TemplateDeductionsSectionProps) {
  const watchedDeductions = useWatch({ control, name: "deductions" });
  const typeLabels = builderCopy.deductionTypeLabels;
  const sectionTitle = operationalLexicon
    ? builderCopy.deductionsSectionTitle
    : detailCopy.deductionsTitle;
  const emptyLabel = operationalLexicon
    ? builderCopy.noDeductions
    : detailCopy.noDeductions;

  return (
    <FormSectionCard
      title={
        stepPrefix.trim()
          ? `${stepPrefix} ${sectionTitle}`
          : sectionTitle
      }
      icon={<MinusCircle className="h-4 w-4" />}
      contentClassName="space-y-4"
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() =>
            appendDeduction({
              deductionType: "savings_fund",
              label: defaultLabelForType("savings_fund"),
              amount: 200,
              period: "weekly",
              isMandatory: true,
            })
          }
        >
          {sheetCopy.addDeduction}
        </Button>
      }
    >
      {deductionFields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        deductionFields.map((field, index) => (
          <div key={field.id} className="rounded-lg border bg-muted/15 p-3 space-y-3">
            <Controller
              control={control}
              name={`deductions.${index}.deductionType`}
              render={({ field: typeField }) => {
                const showLabelInput =
                  !operationalLexicon || typeField.value === "other_deduction";

                return (
                  <div
                    className={
                      showLabelInput
                        ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                        : "grid grid-cols-1 gap-3"
                    }
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`deduction-type-${index}`}>
                        {sheetCopy.deductionType}
                      </Label>
                      <Select
                        value={typeField.value}
                        onValueChange={(value) => {
                          const nextType = value as TemplateDeductionType;
                          typeField.onChange(nextType);
                          if (operationalLexicon && nextType !== "other_deduction") {
                            setValue(
                              `deductions.${index}.label`,
                              defaultLabelForType(nextType),
                              { shouldDirty: true },
                            );
                          }
                        }}
                      >
                        <SelectTrigger
                          id={`deduction-type-${index}`}
                          className="h-10"
                          aria-label={sheetCopy.deductionType}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(typeLabels) as TemplateDeductionType[]).map((key) => (
                            <SelectItem key={key} value={key}>
                              {typeLabels[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!showLabelInput ? (
                        <input
                          type="hidden"
                          {...register(`deductions.${index}.label`)}
                        />
                      ) : null}
                    </div>

                    {showLabelInput ? (
                      <div className="space-y-1.5">
                        <Label htmlFor={`deduction-label-${index}`}>
                          {sheetCopy.deductionLabel}
                        </Label>
                        <Input
                          id={`deduction-label-${index}`}
                          className="h-10"
                          placeholder={sheetCopy.deductionLabel}
                          {...register(`deductions.${index}.label`)}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`deduction-amount-${index}`}>
                  {sheetCopy.deductionAmount}
                </Label>
                <Controller
                  control={control}
                  name={`deductions.${index}.amount`}
                  render={({ field, fieldState }) => (
                    <MoneyInput
                      id={`deduction-amount-${index}`}
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
                <Label htmlFor={`deduction-period-${index}`}>
                  {sheetCopy.deductionPeriod}
                </Label>
                <Controller
                  control={control}
                  name={`deductions.${index}.period`}
                  render={({ field: periodField }) => (
                    <Select
                      value={periodField.value}
                      onValueChange={periodField.onChange}
                    >
                      <SelectTrigger
                        id={`deduction-period-${index}`}
                        className="h-10"
                        aria-label={sheetCopy.deductionPeriod}
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
                <p className="text-xs text-muted-foreground">
                  {sheetCopy.deductionPeriodHint}
                </p>
              </div>
            </div>

            {(() => {
              const watched = watchedDeductions?.[index];
              const prose = describeDeductionProse(
                watched?.label,
                watched?.amount,
                watched?.period,
              );
              if (!prose) return null;
              return (
                <p className="text-xs text-muted-foreground leading-relaxed bg-destructive/5 p-2.5 rounded-md border border-destructive/10">
                  {prose}
                </p>
              );
            })()}

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => removeDeduction(index)}
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
