import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWatch } from "react-hook-form";
import {
  AlertCircle,
  Banknote,
  FileStack,
  Gift,
  Route,
} from "lucide-react";
import {
  BuilderPageShell,
  type BuilderFooterAction,
  type BuilderSection,
} from "@shared/ui/page-shells/BuilderPageShell";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
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
import { LoadingPageState, NotFoundState } from "@shared/ui/feedback-states";
import { usePermissions } from "@shared/permissions";
import { settlementCreatePath } from "@features/settlements/application/settlementsRoutes";
import {
  COMPENSATION_TEMPLATES_PATH,
  compensationTemplateOperatorsPath,
} from "../../application/compensationRoutes";
import {
  useCompensationTemplate,
  useTemplateAssignments,
} from "../../application/hooks";
import { useCompensationTemplateForm } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { getTemplateSectionStatuses } from "../utils/getTemplateCompleteness";
import type { BuilderSectionId } from "../utils/templateCompositionTypes";
import { BuilderIdentitySection } from "../components/BuilderIdentitySection";
import { BuilderPaymentRulesSection } from "../components/BuilderPaymentRulesSection";
import { BuilderAllowancesSection } from "../components/BuilderAllowancesSection";
import { BuilderCorridorsSection } from "../components/BuilderCorridorsSection";
import { BuilderInspectorPanel } from "../components/BuilderInspectorPanel";

const copy = compensationCopy.builder;

const SECTION_IDS: BuilderSectionId[] = ["payment", "allowances", "corridors"];

const SECTION_ICONS: Record<BuilderSectionId, ReactNode> = {
  payment: <Banknote className="h-4 w-4" />,
  allowances: <Gift className="h-4 w-4" />,
  corridors: <Route className="h-4 w-4" />,
};

export function CompensationSchemeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");

  const [activeSectionId, setActiveSectionId] = useState<BuilderSectionId>("payment");
  const [discardOpen, setDiscardOpen] = useState(false);

  const {
    data: template,
    isLoading,
    isError,
  } = useCompensationTemplate(id);

  const backHref = COMPENSATION_TEMPLATES_PATH;

  const formApi = useCompensationTemplateForm({
    template,
    enabled: Boolean(template),
    formId: id ? `compensation-builder-${id}` : undefined,
    onSuccess: () => {
      navigate(COMPENSATION_TEMPLATES_PATH);
    },
  });

  const {
    form,
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
  } = formApi;

  const watchedValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  const { data: assignmentsData } = useTemplateAssignments({
    templateId: id ?? "",
    pageSize: 5,
    enabled: Boolean(id) && canUpdate,
  });

  const activeAssignment = useMemo(() => {
    const rows = assignmentsData?.data ?? [];
    return rows.find((row) => row.isActive) ?? rows[0] ?? null;
  }, [assignmentsData?.data]);

  const previewHref = activeAssignment
    ? settlementCreatePath({ employeeId: activeAssignment.employeeId })
    : id
      ? compensationTemplateOperatorsPath(id)
      : null;

  const sections: BuilderSection[] = useMemo(() => {
    const statuses = getTemplateSectionStatuses({
      name: (watchedValues.name as string | undefined) ?? template?.name ?? "",
      rules: (watchedValues.rules as CompensationTemplateFormData["rules"]) ?? [],
      fixedAllowances:
        (watchedValues.fixedAllowances as CompensationTemplateFormData["fixedAllowances"]) ??
        [],
      corridorIds:
        (watchedValues.corridorIds as CompensationTemplateFormData["corridorIds"]) ?? [],
    });

    return SECTION_IDS.map((sectionId) => ({
      id: sectionId,
      label: copy.sections[sectionId],
      icon: SECTION_ICONS[sectionId],
      status: statuses[sectionId],
    }));
  }, [template?.name, watchedValues]);

  const handleSectionChange = useCallback((sectionId: string) => {
    if ((SECTION_IDS as readonly string[]).includes(sectionId)) {
      setActiveSectionId(sectionId as BuilderSectionId);
    }
  }, []);

  const navigateBack = useCallback(() => {
    navigate(COMPENSATION_TEMPLATES_PATH);
  }, [navigate]);

  const handleDiscardClick = useCallback(() => {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    navigateBack();
  }, [isDirty, navigateBack]);

  const displayTitle =
    ((watchedValues.name as string | undefined) ?? template?.name ?? "").trim() ||
    copy.sections.payment;

  const isActive = Boolean(watchedValues.isActive ?? template?.isActive);

  const footerActions: BuilderFooterAction[] = useMemo(() => {
    const actions: BuilderFooterAction[] = [
      {
        id: "discard",
        label: copy.discard,
        variant: "outline",
        onClick: handleDiscardClick,
        disabled: isSaving,
      },
    ];

    if (previewHref) {
      actions.push({
        id: "preview",
        // Label corto: el panel derecho ya no lleva este CTA (overflow con nombres largos).
        label: copy.trySchemeTitle,
        variant: "outline",
        onClick: () => {
          navigate(previewHref);
        },
        disabled: isSaving,
      });
    }

    actions.push({
      id: "save",
      label: copy.save,
      onClick: () => {
        void onSubmit();
      },
      disabled: isSaving || !canUpdate,
      loading: isSaving,
    });

    return actions;
  }, [canUpdate, handleDiscardClick, isSaving, navigate, onSubmit, previewHref]);

  if (!canUpdate) {
    return (
      <NotFoundState
        icon={<AlertCircle />}
        title={copy.noPermissionTitle}
        description={copy.noPermissionDescription}
        backHref={backHref}
        backLabel={copy.backLabel}
      />
    );
  }

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label={copy.loadingLabel}>
        <LoadingPageState variant="builder" />
      </div>
    );
  }

  if (isError || !template || !id) {
    return (
      <NotFoundState
        icon={<FileStack />}
        title={copy.notFoundTitle}
        description={copy.notFoundDescription}
        backHref={backHref}
        backLabel={copy.backLabel}
      />
    );
  }

  return (
    <>
      <form
        id={formApi.formId}
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <BuilderPageShell
          title={displayTitle}
          description={copy.pageDescription}
          backHref={backHref}
          backLabel={copy.backLabel}
          statusBadge={
            <Badge variant={isActive ? "success" : "secondary"} tone="soft">
              {isActive ? copy.statusActive : copy.statusInactive}
            </Badge>
          }
          banner={
            <div className="space-y-3">
              {apiError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{copy.saveErrorTitle}</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              ) : null}
              <BuilderIdentitySection
                form={form}
                validationMessages={validationMessages}
                showValidation
              />
            </div>
          }
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionChange={handleSectionChange}
          sectionsAriaLabel={copy.sectionsAriaLabel}
          inspectorTitle={copy.inspectorTitle}
          canvasAriaLabel={copy.canvasAriaLabel}
          collapseInspectorLabel={copy.collapseInspectorLabel}
          statusLabels={copy.statusLabels}
          renderCanvas={(sectionId) => {
            switch (sectionId as BuilderSectionId) {
              case "payment":
                return (
                  <BuilderPaymentRulesSection
                    form={form}
                    ruleFields={ruleFields}
                    appendRule={appendRule}
                    removeRule={removeRule}
                    watchedRules={watchedRules}
                  />
                );
              case "allowances":
                return (
                  <BuilderAllowancesSection
                    form={form}
                    allowanceFields={allowanceFields}
                    appendAllowance={appendAllowance}
                    removeAllowance={removeAllowance}
                  />
                );
              case "corridors":
                return <BuilderCorridorsSection form={form} />;
              default:
                return null;
            }
          }}
          renderInspector={() => (
            <BuilderInspectorPanel control={form.control} template={template} />
          )}
          footerActions={footerActions}
        />
      </form>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.discardConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.discardConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.discardKeepEditing}</AlertDialogCancel>
            <AlertDialogAction onClick={navigateBack}>
              {copy.discardConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
