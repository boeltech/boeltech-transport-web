import { useMemo, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle, Loader2, Plus, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { FormValidationSummary } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  APPROVAL_MAX_TIERS,
  POLICY_TEMPLATE_IDS,
  buildPolicyTemplate,
  classifySavePolicyError,
  conceptAllowsNoApprovalTier,
  describeConditions,
  describeTier,
  distinctSignersForTier,
  formatPolicyAmount,
  summarizeRules,
  templateAvailability,
  type ApprovalRules,
  type ConceptPolicy,
  type PolicyTemplateId,
  type SavePolicyErrorKind,
} from "../../domain";
import { useResetApprovalPolicy, useSaveApprovalPolicy } from "../../application";
import {
  APPROVAL_CONCEPT_LABELS,
  TEMPLATE_LABELS,
  approvalPoliciesCopy,
  categoryLabelFor,
} from "../copy/approvalPoliciesCopy";
import {
  buildApprovalPolicySchema,
  emptyTier,
  formValuesToRules,
  rulesToFormValues,
  type PolicyFormTier,
  type PolicyFormValues,
} from "../validation/approvalPolicySchema";
import { placeSavePolicyErrors } from "../utils/policyServerErrors";
import { PolicySimulator } from "./PolicySimulator";
import type { PolicyPeopleState } from "./PolicyStepEditor";
import { PolicyTierEditor } from "./PolicyTierEditor";
import { SelfApprovalFloorNote } from "./SelfApprovalFloorNote";

const copy = approvalPoliciesCopy.sheet;
const FORM_ID = "approval-policy-form";

export type ApprovalPolicySheetMode = "edit" | "view";

interface ApprovalPolicySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: ConceptPolicy | null;
  mode: ApprovalPolicySheetMode;
  /** Padrón de personas del editor (solo editores). */
  people: PolicyPeopleState;
  /** Vuelve a pedir el padrón tras un error. */
  onRetryPeople: () => void;
  /** Vuelve a leer el overview tras un 409 o un 403 de edición. */
  onReload: () => void;
}

function isUnconditionedTier(tier: PolicyFormTier): boolean {
  return tier.categories.length === 0 && !tier.missingCfdi && !tier.manualAdjustments;
}

export function ApprovalPolicySheet({
  open,
  onOpenChange,
  policy,
  mode,
  people,
  onRetryPeople,
  onReload,
}: ApprovalPolicySheetProps) {
  const label = policy ? APPROVAL_CONCEPT_LABELS[policy.concept] : "";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex h-full w-full flex-col bg-background p-0 sm:max-w-xl md:max-w-2xl"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0 border-b bg-card px-6 py-4">
          <SheetTitle>{mode === "edit" ? copy.titleEdit(label) : copy.titleView(label)}</SheetTitle>
          <SheetDescription>{mode === "edit" ? copy.descriptionEdit : copy.descriptionView}</SheetDescription>
        </SheetHeader>
        {policy ? (
          mode === "edit" ? (
            <PolicyEditor
              key={`${policy.concept}-${policy.version ?? "default"}-${policy.source}`}
              policy={policy}
              people={people}
              onRetryPeople={onRetryPeople}
              onClose={() => onOpenChange(false)}
              onReload={onReload}
            />
          ) : (
            <PolicyViewer policy={policy} onClose={() => onOpenChange(false)} />
          )
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function PolicyViewer({ policy, onClose }: { policy: ConceptPolicy; onClose: () => void }) {
  const categoryLabel = categoryLabelFor(policy.concept);
  const ordered = [...policy.rules.tiers].sort((a, b) => a.minAmount - b.minAmount);
  return (
    <>
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <ol className="space-y-2" aria-label={copy.summaryLabel}>
          {ordered.map((tier, index) => (
            <li key={index} className="rounded-lg border bg-card p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                {copy.tierTitle(index + 1)}
                {index === 0 ? "" : ` · desde ${formatPolicyAmount(tier.minAmount)}`}
                {describeConditions(tier, { categoryLabel })}
              </p>
              <p className="font-medium">{describeTier(tier, policy.concept)}</p>
            </li>
          ))}
        </ol>
        <SelfApprovalFloorNote />
        <PolicySimulator concept={policy.concept} getRules={() => null} isDraft={false} defaultOpen />
      </div>
      <SheetFooter className="shrink-0 border-t bg-card px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {copy.close}
        </Button>
      </SheetFooter>
    </>
  );
}

interface PolicyEditorProps {
  policy: ConceptPolicy;
  people: PolicyPeopleState;
  onRetryPeople: () => void;
  onClose: () => void;
  onReload: () => void;
}

function PolicyEditor({ policy, people, onRetryPeople, onClose, onReload }: PolicyEditorProps) {
  const { concept } = policy;
  const candidateUsers = people.status === "ready" ? people.users : null;
  const { toast } = useToast();
  const saveMutation = useSaveApprovalPolicy();
  const resetMutation = useResetApprovalPolicy();
  const schema = useMemo(() => buildApprovalPolicySchema(concept), [concept]);
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<PolicyFormValues>,
    defaultValues: rulesToFormValues(policy.rules),
  });
  const tiers = useWatch({ control: form.control, name: "tiers" }) ?? [];
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [pendingSave, setPendingSave] = useState<ApprovalRules | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [blocking, setBlocking] = useState<{ kind: SavePolicyErrorKind; message: string } | null>(null);

  // Sin tramo por monto (`null`) no hay umbral que conservar: la plantilla arranca en $0.
  const threshold = concept === "settlement" ? (policy.voboThresholdMxn ?? 0) : 0;
  const allowsNoApprovalTier = conceptAllowsNoApprovalTier(concept);
  const thresholdTierIndex = allowsNoApprovalTier
    ? tiers.findIndex((tier) => tier.requiresApproval && isUnconditionedTier(tier))
    : -1;
  const canAddNoApprovalTier =
    allowsNoApprovalTier &&
    tiers.length < APPROVAL_MAX_TIERS &&
    !tiers.some((tier) => !tier.requiresApproval);
  const categoryLabel = categoryLabelFor(concept);
  const draftRules = formValuesToRules({ tiers });
  const summary = tiers.length > 0 ? summarizeRules(draftRules, concept, { categoryLabel }) : "";
  const expectedVersion = policy.source === "system_default" ? null : policy.version;
  const busy = saveMutation.isPending || resetMutation.isPending;
  const summaryMessages = submitAttempted
    ? collectFieldErrorMessages(form.formState.errors as never, 8)
    : [];

  const applyTemplate = (id: PolicyTemplateId) => {
    const rules = buildPolicyTemplate(id, { concept, settlementThresholdMxn: threshold });
    form.reset(rulesToFormValues(rules), { keepDefaultValues: true });
    setSubmitAttempted(false);
    setBlocking(null);
  };

  const addTier = () => {
    const highest = Math.max(0, ...tiers.map((tier) => tier.minAmount));
    form.setValue("tiers", [...tiers, emptyTier(concept, highest > 0 ? highest * 2 : 10_000)], {
      shouldDirty: true,
    });
  };

  /** D4: el tramo base pasa a «sin autorización» y el usuario captura desde cuánto se pide. */
  const addNoApprovalTier = () => {
    const noApprovalBase: PolicyFormTier = {
      ...emptyTier(concept, 0),
      requiresApproval: false,
      steps: [],
    };
    form.setValue("tiers", [noApprovalBase, ...tiers], { shouldDirty: true });
    form.clearErrors("tiers");
    window.setTimeout(() => document.getElementById("policy-tier-1-amount")?.focus(), 0);
  };

  const removeTier = (index: number) => {
    form.setValue(
      "tiers",
      tiers.filter((_, i) => i !== index),
      { shouldDirty: true },
    );
    form.clearErrors("tiers");
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      setBlocking(null);
      setPendingSave(formValuesToRules(values));
    },
    () => setSubmitAttempted(true),
  );

  const handleError = (error: unknown) => {
    const classified = classifySavePolicyError(error);
    if (classified.kind === "validation" || classified.kind === "unsatisfiable") {
      const draft = formValuesToRules(form.getValues());
      const placed = placeSavePolicyErrors(classified, (tierIndex) =>
        candidateUsers && draft.tiers[tierIndex]
          ? distinctSignersForTier(draft.tiers[tierIndex].steps, concept, candidateUsers)
          : 1,
      );
      for (const item of placed) {
        form.setError((item.field ?? "root.server") as never, { type: "server", message: item.message });
      }
      setSubmitAttempted(true);
      return;
    }
    if (classified.kind === "conflict") {
      setBlocking({ kind: "conflict", message: classified.message ?? copy.conflictTitle });
      return;
    }
    if (classified.kind === "edit_disabled") {
      setBlocking({ kind: "edit_disabled", message: classified.message ?? approvalPoliciesCopy.page.editDisabled });
      onReload();
      return;
    }
    setBlocking({ kind: "other", message: getErrorMessage(error) || approvalPoliciesCopy.toasts.saveError });
  };

  const confirmSave = async () => {
    const rules = pendingSave;
    setPendingSave(null);
    if (!rules) return;
    try {
      const result = await saveMutation.mutateAsync({ concept, expectedVersion, rules });
      toast({ title: result.message || approvalPoliciesCopy.toasts.saved, variant: "success" });
      if (result.data.warnings.length > 0) {
        toast({
          title: approvalPoliciesCopy.toasts.singleEligibleWarning(result.data.warnings.length),
          variant: "warning",
        });
      }
      onClose();
    } catch (error) {
      handleError(error);
    }
  };

  const doReset = async () => {
    setConfirmReset(false);
    try {
      const result = await resetMutation.mutateAsync({ concept, expectedVersion });
      toast({ title: result.message || approvalPoliciesCopy.toasts.reset, variant: "success" });
      onClose();
    } catch (error) {
      handleError(error);
    }
  };

  const confirmCopy = approvalPoliciesCopy.confirm;
  const standardThreshold = concept === "settlement" ? policy.standardVoboThresholdMxn : undefined;
  const resetDescription =
    typeof standardThreshold !== "number"
      ? confirmCopy.resetDescription
      : standardThreshold > 0
        ? confirmCopy.resetDescriptionSettlement(formatPolicyAmount(standardThreshold))
        : confirmCopy.resetDescriptionSettlementZero;

  return (
    <>
      <form id={FORM_ID} onSubmit={onSubmit} className="flex-1 space-y-6 overflow-y-auto px-6 py-5" noValidate>
        {blocking ? (
          <Alert variant={blocking.kind === "conflict" ? "warning" : "destructive"} data-testid="policy-blocking-alert">
            {blocking.kind === "conflict" ? <AlertTriangle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>
              {blocking.kind === "conflict"
                ? copy.conflictTitle
                : blocking.kind === "edit_disabled"
                  ? copy.editDisabledTitle
                  : approvalPoliciesCopy.toasts.saveError}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{blocking.message}</p>
              {blocking.kind === "conflict" ? (
                <Button type="button" size="sm" variant="outline" onClick={onReload}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  {copy.reload}
                </Button>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {people.status === "error" ? (
          <Alert variant="destructive" data-testid="policy-people-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{copy.peopleLoadError}</span>
              <Button type="button" size="sm" variant="outline" onClick={onRetryPeople}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                {copy.peopleRetry}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="space-y-2">
          <div>
            <h3 className="text-sm font-semibold">{copy.templatesTitle}</h3>
            <p className="text-xs text-muted-foreground">{copy.templatesHint}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {POLICY_TEMPLATE_IDS.map((id) => {
              const availability = templateAvailability(id, concept, candidateUsers);
              return (
                <div key={id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                  <p className="text-sm font-medium">{TEMPLATE_LABELS[id].title}</p>
                  <p className="flex-1 text-xs text-muted-foreground">
                    {availability.available ? TEMPLATE_LABELS[id].description : availability.reason}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!availability.available || busy}
                    onClick={() => applyTemplate(id)}
                    aria-label={`${copy.applyTemplate} ${TEMPLATE_LABELS[id].title}`}
                  >
                    {copy.applyTemplate}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          {tiers.map((_, index) => (
            <PolicyTierEditor
              key={index}
              form={form}
              concept={concept}
              tierIndex={index}
              people={people}
              amountHint={index === thresholdTierIndex ? copy.thresholdAmountHint : undefined}
              onRemove={index === 0 ? undefined : () => removeTier(index)}
            />
          ))}
          {tiers.length < APPROVAL_MAX_TIERS ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addTier} disabled={busy}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {copy.addTier}
              </Button>
              {canAddNoApprovalTier ? (
                <Button type="button" variant="outline" size="sm" onClick={addNoApprovalTier} disabled={busy}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {copy.addNoApprovalTier}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{copy.maxTiers}</p>
          )}
        </section>

        {summary ? (
          <section className="rounded-lg bg-muted/40 p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">{copy.summaryLabel}</p>
            <p data-testid="policy-draft-summary">{summary}</p>
          </section>
        ) : null}

        <SelfApprovalFloorNote />

        <PolicySimulator
          concept={concept}
          getRules={() => formValuesToRules(form.getValues())}
          isDraft
        />

        <FormValidationSummary messages={summaryMessages} title={copy.validationTitle} />
      </form>

      <SheetFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t bg-card px-6 py-4 sm:justify-between">
        <div>
          {policy.source === "tenant" ? (
            <Button type="button" variant="ghost" onClick={() => setConfirmReset(true)} disabled={busy}>
              {resetMutation.isPending ? copy.resetting : copy.reset}
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {copy.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} disabled={busy || blocking?.kind === "edit_disabled"}>
            {saveMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {saveMutation.isPending ? copy.saving : copy.save}
          </Button>
        </div>
      </SheetFooter>

      <AlertDialog open={pendingSave !== null} onOpenChange={(next) => (!next ? setPendingSave(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {policy.pendingRequests > 0
                ? confirmCopy.description(policy.pendingRequests)
                : confirmCopy.descriptionNoPending}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingSave ? (
            <p className="rounded-md bg-muted/40 p-3 text-sm">
              {summarizeRules(pendingSave, concept, { categoryLabel })}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{confirmCopy.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmSave()}>{confirmCopy.confirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy.resetTitle}</AlertDialogTitle>
            <AlertDialogDescription>{resetDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{confirmCopy.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doReset()}>{confirmCopy.resetConfirm}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
