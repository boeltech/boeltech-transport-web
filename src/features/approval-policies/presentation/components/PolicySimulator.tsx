import { useState } from "react";
import { AlertCircle, ChevronDown, FlaskConical, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@shared/ui/collapsible";
import { Label } from "@shared/ui/label";
import { MoneyInput } from "@shared/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/ui/select";
import { ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { cn } from "@shared/lib/utils/cn";
import { CONDITIONS_BY_CONCEPT, type ApprovalConcept, type ApprovalRules } from "../../domain";
import { useSimulateApprovalPolicy } from "../../application";
import { CONCEPT_CATEGORY_LABELS, approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";

const copy = approvalPoliciesCopy.simulator;
const NO_CATEGORY = "__none__";

interface PolicySimulatorProps {
  concept: ApprovalConcept;
  /** Borrador a probar; `null` = regla vigente. */
  getRules: () => ApprovalRules | null;
  isDraft: boolean;
  defaultOpen?: boolean;
}

/** «Probar la regla» (ADR-0099 UX3): prueba el borrador sin guardar. */
export function PolicySimulator({
  concept,
  getRules,
  isDraft,
  defaultOpen = false,
}: PolicySimulatorProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string>(NO_CATEGORY);
  const [missingCfdi, setMissingCfdi] = useState(false);
  const [manualAdjustments, setManualAdjustments] = useState(false);
  const simulate = useSimulateApprovalPolicy();
  const conditions = CONDITIONS_BY_CONCEPT[concept];
  const categoryLabels = CONCEPT_CATEGORY_LABELS[concept] ?? {};
  const result = simulate.data;
  const idPrefix = `policy-sim-${concept}`;

  const run = () => {
    simulate.mutate({
      concept,
      rules: getRules(),
      facts: {
        amount: amount ?? 0,
        ...(conditions.includes("category") && category !== NO_CATEGORY ? { category } : {}),
        ...(conditions.includes("missingCfdi") ? { missingCfdi } : {}),
        ...(conditions.includes("manualAdjustments") ? { manualAdjustments } : {}),
      },
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
        >
          <span className="inline-flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            {copy.title}
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 border-t px-4 py-4">
        <p className="text-xs text-muted-foreground">{isDraft ? copy.hintDraft : copy.hintCurrent}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-amount`}>{copy.amount}</Label>
            <MoneyInput
              id={`${idPrefix}-amount`}
              value={amount}
              onValueChange={setAmount}
              currencyCode="MXN"
              decimals={2}
            />
          </div>
          {conditions.includes("category") ? (
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-category`}>{copy.category}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id={`${idPrefix}-category`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>{copy.anyCategory}</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        {conditions.includes("missingCfdi") ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={missingCfdi} onCheckedChange={(v) => setMissingCfdi(v === true)} />
            {copy.missingCfdi}
          </label>
        ) : null}
        {conditions.includes("manualAdjustments") ? (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={manualAdjustments}
              onCheckedChange={(v) => setManualAdjustments(v === true)}
            />
            {copy.manualAdjustments}
          </label>
        ) : null}
        <Button type="button" size="sm" variant="outline" onClick={run} disabled={simulate.isPending}>
          {simulate.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          {simulate.isPending ? copy.running : copy.run}
        </Button>

        {simulate.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{getErrorMessage(simulate.error) || copy.error}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="space-y-2 rounded-md bg-muted/40 p-3 text-sm" data-testid="policy-simulation-result">
            {!result.requiresApproval ? (
              <p className="font-medium">{copy.noApproval}</p>
            ) : (
              <>
                <p className="font-medium">{copy.tierApplied(result.tierIndex + 1)}</p>
                {result.steps.map((step) => (
                  <div key={step.stepNo}>
                    <p className="text-xs font-medium text-muted-foreground">
                      {copy.stepLine(step.stepNo, result.steps.length)}
                    </p>
                    <p>
                      {step.eligible.length > 0
                        ? step.eligible
                            .map((user) => `${user.fullName} (${ROLE_LABELS[user.role as UserRole] ?? user.role})`)
                            .join(", ")
                        : copy.nobody}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
