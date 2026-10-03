import { get, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { FieldInlineError, MoneyInput, getFieldErrorAriaProps } from "@shared/ui/form";
import {
  CONDITIONS_BY_CONCEPT,
  conceptAllowsNoApprovalTier,
  conceptMaxSteps,
  type ApprovalConcept,
  type PolicyCandidateUser,
} from "../../domain";
import { CONCEPT_CATEGORY_LABELS, approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
import { emptyStep, type PolicyFormTier, type PolicyFormValues } from "../validation/approvalPolicySchema";
import { PolicyStepEditor } from "./PolicyStepEditor";

const copy = approvalPoliciesCopy.sheet;

interface PolicyTierEditorProps {
  form: UseFormReturn<PolicyFormValues>;
  concept: ApprovalConcept;
  tierIndex: number;
  candidateUsers: PolicyCandidateUser[] | null;
  onRemove?: () => void;
}

export function PolicyTierEditor({ form, concept, tierIndex, candidateUsers, onRemove }: PolicyTierEditorProps) {
  const path = `tiers.${tierIndex}` as const;
  const tier = useWatch({ control: form.control, name: path }) as PolicyFormTier | undefined;
  const errors = form.formState.errors;
  const amountError = (get(errors, `${path}.minAmount`) as { message?: string } | undefined)?.message;
  const tierError = (get(errors, path) as { message?: string } | undefined)?.message;
  const isBase = tierIndex === 0;
  const conditions = CONDITIONS_BY_CONCEPT[concept];
  const categoryLabels = CONCEPT_CATEGORY_LABELS[concept] ?? {};
  const maxSteps = conceptMaxSteps(concept);
  const amountId = `policy-tier-${tierIndex}-amount`;

  if (!tier) return null;

  const set = <K extends keyof PolicyFormTier>(key: K, value: PolicyFormTier[K]) => {
    form.setValue(`${path}.${key}` as never, value as never, { shouldDirty: true });
    form.clearErrors(path);
  };

  const toggleCategory = (category: string, checked: boolean) => {
    set(
      "categories",
      checked ? [...tier.categories, category] : tier.categories.filter((c) => c !== category),
    );
  };

  const setRequiresApproval = (requires: boolean) => {
    form.setValue(
      path,
      { ...tier, requiresApproval: requires, steps: requires ? [emptyStep(concept)] : [] },
      { shouldDirty: true },
    );
    form.clearErrors(path);
  };

  return (
    <section
      className="space-y-4 rounded-lg border bg-card p-4"
      aria-label={copy.tierTitle(tierIndex + 1)}
      data-testid={`policy-tier-${tierIndex}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{copy.tierTitle(tierIndex + 1)}</h3>
        {onRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {copy.removeTier}
          </Button>
        ) : null}
      </div>
      <FieldInlineError fieldId={`policy-tier-${tierIndex}`} message={tierError} />

      {isBase ? (
        <p className="text-xs text-muted-foreground">{copy.baseTier}</p>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor={amountId}>{copy.minAmount}</Label>
          <MoneyInput
            id={amountId}
            value={tier.minAmount}
            onValueChange={(value) => set("minAmount", value ?? 0)}
            currencyCode="MXN"
            decimals={2}
            error={Boolean(amountError)}
            {...getFieldErrorAriaProps(amountId, amountError)}
          />
          <FieldInlineError fieldId={amountId} message={amountError} />
        </div>
      )}
      {isBase && amountError ? <FieldInlineError fieldId={amountId} message={amountError} /> : null}

      {!isBase && conditions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium">{copy.conditionsTitle}</p>
          {conditions.includes("category") ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">{copy.categoriesLabel}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={tier.categories.includes(value)}
                      onCheckedChange={(checked) => toggleCategory(value, checked === true)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {conditions.includes("missingCfdi") ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={tier.missingCfdi}
                onCheckedChange={(checked) => set("missingCfdi", checked === true)}
              />
              {copy.missingCfdi}
            </label>
          ) : null}
          {conditions.includes("manualAdjustments") ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={tier.manualAdjustments}
                onCheckedChange={(checked) => set("manualAdjustments", checked === true)}
              />
              {copy.manualAdjustments}
            </label>
          ) : null}
          <p className="text-xs text-muted-foreground">{copy.conditionsHint}</p>
        </div>
      ) : null}

      {conceptAllowsNoApprovalTier(concept) ? (
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={!tier.requiresApproval}
            onCheckedChange={(checked) => setRequiresApproval(checked !== true)}
            className="mt-0.5"
          />
          <span>
            {copy.noApproval}
            <span className="block text-xs text-muted-foreground">{copy.noApprovalHint}</span>
          </span>
        </label>
      ) : null}

      {tier.requiresApproval ? (
        <div className="space-y-3">
          {tier.steps.map((_, stepIndex) => (
            <PolicyStepEditor
              key={stepIndex}
              form={form}
              concept={concept}
              tierIndex={tierIndex}
              stepIndex={stepIndex}
              stepsInTier={tier.steps.length}
              candidateUsers={candidateUsers}
            />
          ))}
          {maxSteps > 1 ? (
            tier.steps.length < maxSteps ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("steps", [...tier.steps, emptyStep(concept)])}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {copy.addStep}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => set("steps", tier.steps.slice(0, 1))}
              >
                {copy.removeStep}
              </Button>
            )
          ) : (
            <p className="text-xs text-muted-foreground">{copy.disbursementSingleStep}</p>
          )}
        </div>
      ) : null}
    </section>
  );
}
