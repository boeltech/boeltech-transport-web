import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useWatch } from "react-hook-form";
import {
  AlertCircle,
  Banknote,
  FileStack,
  Gift,
  History,
  Route,
  Users,
} from "lucide-react";
import {
  BuilderPageShell,
  type BuilderFooterAction,
  type BuilderSection,
} from "@shared/ui/page-shells/BuilderPageShell";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
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
import { UnsavedChangesDialog } from "@shared/ui/form";
import { usePermissions } from "@shared/permissions";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { settlementCreatePath } from "@features/settlements/application/settlementsRoutes";
import {
  COMPENSATION_TEMPLATES_PATH,
  compensationTemplateBuildPath,
  compensationTemplateOperatorsPath,
} from "../../application/compensationRoutes";
import {
  useActivateCompensationTemplate,
  useCompensationTemplate,
  useCreateCompensationTemplateVersion,
  useTemplateAssignments,
  useTemplateVersions,
} from "../../application/hooks";
import { useCompensationTemplateForm } from "../hooks/useCompensationTemplateForm";
import { compensationCopy } from "../copy/compensationCopy";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { getTemplateSectionStatuses } from "../utils/getTemplateCompleteness";
import { getCompensationLifecycleErrorMessage } from "../utils/compensationLifecycleErrors";
import type { BuilderSectionId } from "../utils/templateCompositionTypes";
import {
  getTemplateDisplayStatus,
  getTemplateDisplayStatusLabel,
  isTemplateLockedBySupersede,
  pickActiveTemplateVersion,
} from "../utils/getTemplateDisplayStatus";
import { CompensationTemplateDisplayStatusBadge } from "../config/compensationStatusConfig";
import { BuilderIdentitySection } from "../components/BuilderIdentitySection";
import { BuilderPaymentRulesSection } from "../components/BuilderPaymentRulesSection";
import { BuilderAllowancesSection } from "../components/BuilderAllowancesSection";
import { BuilderCorridorsSection } from "../components/BuilderCorridorsSection";
import { BuilderInspectorPanel } from "../components/BuilderInspectorPanel";

const copy = compensationCopy.builder;
const actionsCopy = compensationCopy.templateActions;

const SECTION_IDS: BuilderSectionId[] = [
  "payment",
  "allowances",
  "corridors",
];

const SECTION_ICONS: Record<BuilderSectionId, ReactNode> = {
  payment: <Banknote className="h-4 w-4" />,
  allowances: <Gift className="h-4 w-4" />,
  corridors: <Route className="h-4 w-4" />,
};

export function CompensationSchemeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");

  const [activeSectionId, setActiveSectionId] = useState<BuilderSectionId>("payment");
  const [activateOpen, setActivateOpen] = useState(false);

  const {
    data: template,
    isLoading,
    isError,
  } = useCompensationTemplate(id);

  const backHref = COMPENSATION_TEMPLATES_PATH;
  const locked = Boolean(template?.lockedForEdit);
  const lockedBySupersede = Boolean(template && isTemplateLockedBySupersede(template));

  const {
    data: familyVersions,
    isLoading: familyVersionsLoading,
    isError: familyVersionsError,
  } = useTemplateVersions(template?.id, lockedBySupersede);
  const activeVersion = useMemo(
    () => pickActiveTemplateVersion(familyVersions),
    [familyVersions],
  );

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
    deductionFields,
    appendDeduction,
    removeDeduction,
    watchedRules,
    validationMessages,
    apiError,
    isSaving,
    onSubmit,
  } = formApi;

  const watchedValues = useWatch({ control: form.control });
  const isDirty = form.formState.isDirty;

  // Guard de cambios sin guardar (DS § Formularios largos). Bloqueada = solo lectura, sin guard.
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
    enabled: !locked,
  });
  // Guardar: liberar el guard mientras corre la mutación (onSuccess navega al catálogo);
  // si falla o la validación no pasa, se vuelve a armar.
  const wasSavingRef = useRef(false);
  useEffect(() => {
    if (isSaving) {
      wasSavingRef.current = true;
      allowLeave();
      return;
    }
    if (wasSavingRef.current) {
      wasSavingRef.current = false;
      resetAllowLeave();
    }
  }, [allowLeave, isSaving, resetAllowLeave]);

  const activateMutation = useActivateCompensationTemplate();
  const createVersionMutation = useCreateCompensationTemplateVersion();

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

  // Descartar navega directo: si hay cambios, el blocker abre `UnsavedChangesDialog`.
  const handleDiscardClick = useCallback(() => {
    navigate(COMPENSATION_TEMPLATES_PATH);
  }, [navigate]);

  const handleCreateVersion = useCallback(async () => {
    if (!template) return;
    try {
      const created = await createVersionMutation.mutateAsync(template.id);
      toast({
        title: compensationCopy.toasts.templateVersionCreated,
        variant: "success",
      });
      navigate(compensationTemplateBuildPath(created.id));
    } catch (error) {
      toast({
        title: actionsCopy.toasts.createVersionError,
        description:
          getCompensationLifecycleErrorMessage(error) ?? getErrorMessage(error),
        variant: "error",
      });
    }
  }, [createVersionMutation, navigate, template, toast]);

  const handleActivate = useCallback(async () => {
    if (!template) return;
    try {
      await activateMutation.mutateAsync({ id: template.id });
      toast({
        title: compensationCopy.toasts.templateActivated,
        variant: "success",
      });
      setActivateOpen(false);
      navigate(COMPENSATION_TEMPLATES_PATH);
    } catch (error) {
      toast({
        title: actionsCopy.toasts.activateError,
        description:
          getCompensationLifecycleErrorMessage(error) ?? getErrorMessage(error),
        variant: "error",
      });
    }
  }, [activateMutation, navigate, template, toast]);

  const displayTitle =
    ((watchedValues.name as string | undefined) ?? template?.name ?? "").trim() ||
    copy.sections.payment;

  const isComplete =
    ((watchedValues.rules as CompensationTemplateFormData["rules"] | undefined)?.length ??
      0) > 0 ||
    ((watchedValues.corridorIds as CompensationTemplateFormData["corridorIds"] | undefined)
      ?.length ?? 0) > 0;

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

    actions.push({
      id: "preview",
      label: copy.trySchemeTitle,
      variant: "outline",
      onClick: () => {
        if (previewHref) navigate(previewHref);
      },
      disabled: isSaving || !previewHref,
    });

    if (locked) {
      actions.push({
        id: "create-version",
        label: copy.lockedBannerAction,
        onClick: () => {
          void handleCreateVersion();
        },
        disabled: createVersionMutation.isPending || !canUpdate,
        loading: createVersionMutation.isPending,
      });
    } else {
      const showActivate =
        canUpdate &&
        (template?.status === "draft" || template?.status === "inactive");
      // Un solo primary sólido: Activar cuando la tarifa está lista (guardada y
      // completa); si no, Guardar es el primary y Activar queda outline deshabilitado.
      const canActivateNow = showActivate && !isDirty && isComplete;

      actions.push({
        id: "save",
        label: copy.save,
        variant: canActivateNow ? "outline" : "default",
        onClick: () => {
          void onSubmit();
        },
        disabled: isSaving || !canUpdate,
        loading: isSaving,
      });

      if (showActivate) {
        actions.push({
          id: "activate",
          label: actionsCopy.activate,
          variant: canActivateNow ? "default" : "outline",
          onClick: () => setActivateOpen(true),
          disabled: !canActivateNow || activateMutation.isPending,
          loading: activateMutation.isPending,
        });
      }
    }

    return actions;
  }, [
    activateMutation.isPending,
    canUpdate,
    createVersionMutation.isPending,
    handleCreateVersion,
    handleDiscardClick,
    isComplete,
    isDirty,
    isSaving,
    locked,
    navigate,
    onSubmit,
    previewHref,
    template?.status,
  ]);

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

  const statusLabel = getTemplateDisplayStatusLabel(template);
  const supersededCopy = copy.supersededBanner;
  const deactivatedCopy = copy.deactivatedOperatorsBanner;
  const showDeactivatedOperators =
    getTemplateDisplayStatus(template) === "deactivated" &&
    template.activeAssignmentsCount > 0;
  const versionsLoaded = !familyVersionsLoading && !familyVersionsError;
  const activeVersionText = !versionsLoaded
    ? null
    : !activeVersion
      ? supersededCopy.noActiveVersion
      : activeVersion.name === template.name
        ? supersededCopy.activeVersionSameName(activeVersion.version)
        : supersededCopy.activeVersionRenamed(activeVersion.name, activeVersion.version);

  return (
    <>
      <form
        id={formApi.formId}
        onSubmit={(event) => {
          event.preventDefault();
          if (!locked) void onSubmit();
        }}
      >
        <BuilderPageShell
          title={displayTitle}
          description={copy.pageDescription}
          backHref={backHref}
          backLabel={copy.backLabel}
          statusBadge={
            <div className="flex flex-wrap items-center gap-2">
              <CompensationTemplateDisplayStatusBadge template={template} />
              <Badge variant="secondary" tone="soft">
                {copy.versionBadge(template.version)}
              </Badge>
              <span className="sr-only">{statusLabel}</span>
            </div>
          }
          banner={
            <div className="space-y-3">
              {locked && lockedBySupersede ? (
                <Alert variant="info" data-testid="builder-superseded-banner">
                  <History className="h-4 w-4" />
                  <AlertTitle>{supersededCopy.title}</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{supersededCopy.assignments(template.activeAssignmentsCount)}</p>
                    {activeVersionText ? <p>{activeVersionText}</p> : null}
                    <div className="flex flex-wrap gap-2">
                      {versionsLoaded && activeVersion ? (
                        <Button type="button" size="sm" asChild>
                          <Link to={compensationTemplateBuildPath(activeVersion.id)}>
                            {supersededCopy.openActiveVersion(activeVersion.version)}
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          familyVersionsLoading || (versionsLoaded && activeVersion)
                            ? "outline"
                            : "default"
                        }
                        disabled={createVersionMutation.isPending}
                        isLoading={createVersionMutation.isPending}
                        onClick={() => void handleCreateVersion()}
                      >
                        {copy.lockedBannerAction}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : locked ? (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{copy.lockedBannerTitle}</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{copy.lockedBannerDescription}</p>
                    <Button
                      type="button"
                      size="sm"
                      disabled={createVersionMutation.isPending}
                      isLoading={createVersionMutation.isPending}
                      onClick={() => void handleCreateVersion()}
                    >
                      {copy.lockedBannerAction}
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}
              {showDeactivatedOperators ? (
                <Alert variant="warning" data-testid="builder-deactivated-operators-banner">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{deactivatedCopy.title}</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>{deactivatedCopy.description(template.activeAssignmentsCount)}</p>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link
                        to={compensationTemplateOperatorsPath(template.id)}
                        className="inline-flex items-center gap-2"
                      >
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        {deactivatedCopy.viewOperators}
                      </Link>
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : null}
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
                readOnly={locked}
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
            const section = (() => {
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
                      deductionFields={deductionFields}
                      appendDeduction={appendDeduction}
                      removeDeduction={removeDeduction}
                    />
                  );
                case "corridors":
                  return <BuilderCorridorsSection form={form} />;
                default:
                  return null;
              }
            })();

            if (!section) return null;
            if (locked) {
              return (
                <div
                  className="pointer-events-none select-none opacity-60"
                  aria-disabled="true"
                >
                  {section}
                </div>
              );
            }
            return section;
          }}
          renderInspector={() => (
            <BuilderInspectorPanel control={form.control} template={template} />
          )}
          footerActions={footerActions}
        />
      </form>

      <UnsavedChangesDialog blocker={blocker} />

      <AlertDialog open={activateOpen} onOpenChange={setActivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionsCopy.activateDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionsCopy.activateDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {template.version > 1 ? (
            <Alert variant="warning">
              <AlertDescription>
                {actionsCopy.activateDialog.reassignWarning}
              </AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{actionsCopy.activateDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={activateMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleActivate();
              }}
            >
              {activateMutation.isPending
                ? actionsCopy.activateDialog.pending
                : actionsCopy.activateDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
