import { useMemo } from "react";
import { AlertCircle, AlertTriangle, Banknote, MapPinned, Route } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { cn } from "@shared/lib/utils/cn";
import type { CompensationTemplate } from "../../domain/entities";
import { useCompensationTemplateForm } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import { buildTemplateCompositionBlocks } from "../utils/buildTemplateCompositionBlocks";
import { getTemplateCompleteness } from "../utils/getTemplateCompleteness";
import { CompensationTemplateFormFields } from "./CompensationTemplateFormFields";
import { TemplateCompositionActions } from "./TemplateCompositionActions";
import { TemplateCompositionBlockView } from "./TemplateCompositionBlock";

const copy = compensationCopy.compositionCanvas;

const MISSING_STEP_LABELS: Record<string, string> = {
  rules: copy.missingSteps.rules,
  corridors: copy.missingSteps.corridors,
};

interface TemplateCompositionPanelProps {
  template: CompensationTemplate;
  id: string;
  mode?: "view" | "edit";
  canUpdate?: boolean;
  embedded?: boolean;
  hideDetailLink?: boolean;
  isDuplicating?: boolean;
  /** Primary edit navigates to Builder when set (ADR-0091). */
  editHref?: string;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onEditSuccess?: () => void;
  onDuplicate?: () => void;
  onShowOperatorsTab?: () => void;
}

function TemplateCompositionPanelView({
  template,
  id,
  canUpdate,
  isDuplicating,
  editHref,
  onEdit,
  onDuplicate,
  onShowOperatorsTab,
}: Pick<
  TemplateCompositionPanelProps,
  | "template"
  | "id"
  | "canUpdate"
  | "isDuplicating"
  | "editHref"
  | "onEdit"
  | "onDuplicate"
  | "onShowOperatorsTab"
>) {
  const blocks = useMemo(() => buildTemplateCompositionBlocks(template), [template]);
  const completeness = useMemo(() => getTemplateCompleteness(template), [template]);
  const [rulesBlock, allowancesBlock, corridorsBlock] = blocks;

  return (
    <>
      {!completeness.isComplete ? (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">{copy.incompleteTitle}</p>
            <ul className="mt-1 list-inside list-disc text-sm">
              {completeness.missingSteps.map((step) => (
                <li key={step}>{MISSING_STEP_LABELS[step] ?? step}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby={`${id}-composition-heading`}>
          <h4
            id={`${id}-composition-heading`}
            className="mb-3 text-sm font-semibold text-foreground"
          >
            {copy.panel.compositionTitle}
          </h4>
          <div className="space-y-2">
            <TemplateCompositionBlockView block={rulesBlock} icon={Route} />
            <TemplateCompositionBlockView block={allowancesBlock} icon={Banknote} />
          </div>
        </section>

        <section aria-labelledby={`${id}-corridors-heading`}>
          <h4
            id={`${id}-corridors-heading`}
            className="mb-3 text-sm font-semibold text-foreground"
          >
            {copy.panel.corridorsTitle}
          </h4>
          <TemplateCompositionBlockView block={corridorsBlock} icon={MapPinned} />
        </section>
      </div>

      <footer className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
        <TemplateCompositionActions
          mode="view"
          canUpdate={canUpdate ?? false}
          isDuplicating={isDuplicating}
          editHref={editHref}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onShowOperators={onShowOperatorsTab}
        />
      </footer>
    </>
  );
}

function TemplateCompositionPanelEdit({
  template,
  canUpdate,
  onCancelEdit,
  onEditSuccess,
}: Pick<TemplateCompositionPanelProps, "template" | "canUpdate" | "onCancelEdit" | "onEditSuccess">) {
  const {
    form,
    formId,
    ruleFields,
    appendRule,
    removeRule,
    allowanceFields,
    appendAllowance,
    removeAllowance,
    watchedRules,
    validationMessages,
    apiError,
    isSaving,
    onSubmit,
  } = useCompensationTemplateForm({
    template,
    enabled: true,
    onSuccess: onEditSuccess,
  });

  return (
    <>
      {apiError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      ) : null}

      <form id={formId} onSubmit={onSubmit} className="space-y-4">
        <CompensationTemplateFormFields
          form={form}
          ruleFields={ruleFields}
          appendRule={appendRule}
          removeRule={removeRule}
          allowanceFields={allowanceFields}
          appendAllowance={appendAllowance}
          removeAllowance={removeAllowance}
          watchedRules={watchedRules}
          validationMessages={validationMessages}
        />
      </form>

      <footer className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
        <TemplateCompositionActions
          mode="edit"
          canUpdate={canUpdate ?? false}
          isSaving={isSaving}
          formId={formId}
          onCancelEdit={onCancelEdit}
        />
      </footer>
    </>
  );
}

export function TemplateCompositionPanel({
  template,
  id,
  mode = "view",
  canUpdate = false,
  embedded = false,
  isDuplicating = false,
  editHref,
  onEdit,
  onCancelEdit,
  onEditSuccess,
  onDuplicate,
  onShowOperatorsTab,
}: TemplateCompositionPanelProps) {
  return (
    <div
      id={id}
      className={cn(embedded ? "space-y-4" : "mt-4 border-t pt-4")}
      role="region"
      aria-label={copy.panelRegionLabel.replace("{{name}}", template.name)}
    >
      {mode === "edit" ? (
        <TemplateCompositionPanelEdit
          template={template}
          canUpdate={canUpdate}
          onCancelEdit={onCancelEdit}
          onEditSuccess={onEditSuccess}
        />
      ) : (
        <TemplateCompositionPanelView
          template={template}
          id={id}
          canUpdate={canUpdate}
          isDuplicating={isDuplicating}
          editHref={editHref}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onShowOperatorsTab={onShowOperatorsTab}
        />
      )}
    </div>
  );
}
