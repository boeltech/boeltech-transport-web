import { Fragment, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CopyPlus,
  Eye,
  MoreHorizontal,
  PauseCircle,
  Settings2,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
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
import { Alert, AlertDescription } from "@shared/ui/alert";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useActivateCompensationTemplate,
  useCreateCompensationTemplateVersion,
  useDeactivateCompensationTemplate,
  useDeleteCompensationTemplate,
} from "../../application/hooks";
import { compensationTemplateBuildPath } from "../../application/compensationRoutes";
import type {
  CompensationTemplate,
  CompensationTemplateVersionRef,
} from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { getCompensationLifecycleErrorMessage } from "../utils/compensationLifecycleErrors";
import { getTemplateUsageStatus } from "../utils/getTemplateCompleteness";
import { getTemplateDisplayStatus } from "../utils/getTemplateDisplayStatus";

const copy = compensationCopy.templateActions;
const hubCopy = compensationCopy.hub;

interface CompensationTemplateActionsProps {
  template: CompensationTemplate;
  onDeleted?: () => void;
  /** Si true, tras crear versión navega al builder del draft. Default true. */
  navigateOnVersionCreate?: boolean;
  /** Abre el panel «Operadores»; sin él no hay «Ver operadores» ni «Asignar a esta tarifa». */
  onOpenOperators?: (templateId: string, assignEmployeeId?: string) => void;
  /** Modo «asignar operador» desde Por pagar: en tarifas listas el único botón es asignar. */
  pendingEmployeeId?: string;
  /** `cards`: «···» arriba a la derecha de la tarjeta (contenedor `relative`) y el botón abajo. */
  layout?: "table" | "cards";
  /**
   * Versión activa de la familia para el aviso al activar (PRD D24). Por defecto la del bloque
   * `family` de la fila; `undefined` sin él = aviso genérico.
   */
  familyActiveVersion?: CompensationTemplateVersionRef | null;
  /** La familia ya tiene un borrador: sin «Crear nueva versión» (PRD D17). */
  familyHasDraft?: boolean;
}

type DialogKind = "activate" | "deactivate" | "createVersion" | "delete" | null;

type ContextualAction = "assign" | "completePayment" | "activate" | "continueDraft" | null;

/** Botón visible por estado (PRD D3, D17); nunca primario. */
function resolveContextualAction(
  template: CompensationTemplate,
  canUpdate: boolean,
  pendingEmployeeId: string | undefined,
  canOpenOperators: boolean,
): ContextualAction {
  if (!canUpdate) return null;
  const usage = getTemplateUsageStatus(template);
  if (pendingEmployeeId && canOpenOperators && usage === "ready") return "assign";
  if (usage === "needs_payment") return "completePayment";
  if (usage === "ready_to_activate") return "activate";
  if (template.family?.draftVersion) return "continueDraft";
  return null;
}

function resolveFamilyActiveVersion(
  template: CompensationTemplate,
  familyActiveVersion: CompensationTemplateVersionRef | null | undefined,
): CompensationTemplateVersionRef | null | undefined {
  if (familyActiveVersion !== undefined) return familyActiveVersion;
  return template.family ? template.family.activeVersion : undefined;
}

export function CompensationTemplateActions({
  template,
  onDeleted,
  navigateOnVersionCreate = true,
  onOpenOperators,
  pendingEmployeeId,
  layout = "table",
  familyActiveVersion,
  familyHasDraft = false,
}: CompensationTemplateActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canDelete = hasPermission("settlements", "delete");

  const activateMutation = useActivateCompensationTemplate();
  const deactivateMutation = useDeactivateCompensationTemplate();
  const createVersionMutation = useCreateCompensationTemplateVersion();
  const deleteMutation = useDeleteCompensationTemplate();

  const [dialog, setDialog] = useState<DialogKind>(null);

  const displayStatus = getTemplateDisplayStatus(template);
  const isSuperseded = displayStatus === "superseded";
  const isInactive = template.status === "inactive";
  const isEditable =
    !template.lockedForEdit && (template.status === "draft" || template.status === "active");
  const buildHref = compensationTemplateBuildPath(template.id);

  const contextual = resolveContextualAction(
    template,
    canUpdate,
    pendingEmployeeId,
    Boolean(onOpenOperators),
  );

  const draftVersion = template.family?.draftVersion ?? null;
  const canCreateVersion =
    canUpdate && template.status === "active" && !draftVersion && !familyHasDraft;
  const canDeactivate = canUpdate && template.status === "active";
  const canActivateFromMenu = canUpdate && isInactive;

  const activeVersion = resolveFamilyActiveVersion(template, familyActiveVersion);
  const replacedVersion =
    activeVersion && activeVersion.id !== template.id ? activeVersion.version : null;
  const activateDescription =
    activeVersion === undefined
      ? isSuperseded
        ? copy.activateDialog.reactivateSupersededDescription
        : copy.activateDialog.description
      : [
          isSuperseded
            ? copy.activateDialog.reactivateSupersededDescriptionKnownFamily
            : copy.activateDialog.descriptionKnownFamily,
          replacedVersion !== null ? copy.activateDialog.replacesActiveVersion(replacedVersion) : null,
        ]
          .filter(Boolean)
          .join(" ");

  const openOperatorsFromMenu = () => {
    if (!onOpenOperators) return;
    setTimeout(() => onOpenOperators(template.id), 0);
  };

  const viewGroup: ReactNode[] = [];
  if (onOpenOperators) {
    viewGroup.push(
      <DropdownMenuItem key="operators" onSelect={openOperatorsFromMenu}>
        <Users className="mr-2 h-4 w-4" />
        {copy.viewOperators}
      </DropdownMenuItem>,
    );
  }
  if (canUpdate) {
    viewGroup.push(
      <DropdownMenuItem key="configuration" asChild>
        <Link to={buildHref}>
          {isEditable ? (
            <Settings2 className="mr-2 h-4 w-4" />
          ) : (
            <Eye className="mr-2 h-4 w-4" />
          )}
          {isEditable ? copy.editConfiguration : copy.viewConfiguration}
        </Link>
      </DropdownMenuItem>,
    );
  }
  if (canCreateVersion) {
    viewGroup.push(
      <DropdownMenuItem key="createVersion" onSelect={() => setDialog("createVersion")}>
        <CopyPlus className="mr-2 h-4 w-4" />
        {copy.createVersion}
      </DropdownMenuItem>,
    );
  }

  const lifecycleGroup: ReactNode[] = [];
  if (canDeactivate) {
    lifecycleGroup.push(
      <DropdownMenuItem key="deactivate" onSelect={() => setDialog("deactivate")}>
        <PauseCircle className="mr-2 h-4 w-4" />
        {copy.deactivate}
      </DropdownMenuItem>,
    );
  }
  if (canActivateFromMenu) {
    lifecycleGroup.push(
      <DropdownMenuItem key="activate" onSelect={() => setDialog("activate")}>
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isSuperseded ? copy.reactivateSuperseded : copy.activate}
      </DropdownMenuItem>,
    );
  }

  const deleteGroup: ReactNode[] = canDelete
    ? [
        <DropdownMenuItem
          key="delete"
          className="text-destructive focus:text-destructive"
          onSelect={() => setDialog("delete")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {copy.delete}
        </DropdownMenuItem>,
      ]
    : [];

  const menuGroups = [viewGroup, lifecycleGroup, deleteGroup].filter(
    (group) => group.length > 0,
  );

  if (menuGroups.length === 0 && contextual === null) {
    return null;
  }

  const closeDialog = () => setDialog(null);

  const resolveError = (error: unknown, fallbackTitle: string) => {
    toast({
      title: fallbackTitle,
      description:
        getCompensationLifecycleErrorMessage(error) ?? getErrorMessage(error),
      variant: "error",
    });
  };

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync({ id: template.id });
      toast({ title: copy.toasts.activateSuccess, variant: "success" });
      closeDialog();
    } catch (error) {
      resolveError(error, copy.toasts.activateError);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(template.id);
      toast({ title: copy.toasts.deactivateSuccess, variant: "success" });
      closeDialog();
    } catch (error) {
      resolveError(error, copy.toasts.deactivateError);
    }
  };

  const handleCreateVersion = async () => {
    try {
      const created = await createVersionMutation.mutateAsync(template.id);
      toast({ title: copy.toasts.createVersionSuccess, variant: "success" });
      closeDialog();
      if (navigateOnVersionCreate) {
        navigate(compensationTemplateBuildPath(created.id));
      }
    } catch (error) {
      resolveError(error, copy.toasts.createVersionError);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(template.id);
      toast({ title: copy.toasts.deleteSuccess, variant: "success" });
      closeDialog();
      onDeleted?.();
    } catch (error) {
      resolveError(error, copy.toasts.deleteError);
    }
  };

  const isPending =
    activateMutation.isPending ||
    deactivateMutation.isPending ||
    createVersionMutation.isPending ||
    deleteMutation.isPending;

  const contextualButton =
    contextual === "assign" ? (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onOpenOperators?.(template.id, pendingEmployeeId)}
      >
        {hubCopy.employeeAssignBanner.assignAction}
      </Button>
    ) : contextual === "completePayment" ? (
      <Button type="button" size="sm" variant="outline" asChild>
        <Link to={buildHref}>{copy.completePayment}</Link>
      </Button>
    ) : contextual === "activate" ? (
      <Button type="button" size="sm" variant="outline" onClick={() => setDialog("activate")}>
        {copy.activateShort}
      </Button>
    ) : contextual === "continueDraft" && draftVersion ? (
      <Button type="button" size="sm" variant="outline" asChild>
        <Link to={compensationTemplateBuildPath(draftVersion.id)}>
          {copy.continueDraft(draftVersion.version)}
        </Link>
      </Button>
    ) : null;

  const menu =
    menuGroups.length > 0 ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0", layout === "cards" && "absolute right-2 top-2")}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{copy.openMenuSr}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {menuGroups.map((group, index) => (
            <Fragment key={index}>
              {index > 0 ? <DropdownMenuSeparator /> : null}
              {group}
            </Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  return (
    // Diálogos y menú viven en portales, pero sus eventos suben por el árbol de React:
    // se detienen aquí para que no abran el panel de la fila o tarjeta.
    <div
      className={cn(
        layout === "table" && "flex items-center justify-end gap-1 whitespace-nowrap",
        layout === "cards" && (contextualButton ? "flex justify-end" : "contents"),
      )}
      onClick={(event) => event.stopPropagation()}
      data-testid="template-row-actions"
    >
      {contextualButton}
      {menu}

      <AlertDialog
        open={dialog === "activate"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuperseded
                ? copy.activateDialog.reactivateSupersededTitle(template.version)
                : copy.activateDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{activateDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          {!isSuperseded && template.version > 1 ? (
            <Alert variant="warning">
              <AlertDescription>{copy.activateDialog.reassignWarning}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.activateDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleActivate();
              }}
            >
              {activateMutation.isPending
                ? copy.activateDialog.pending
                : copy.activateDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialog === "deactivate"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deactivateDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deactivateDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.deactivateDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDeactivate();
              }}
            >
              {deactivateMutation.isPending
                ? copy.deactivateDialog.pending
                : copy.deactivateDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialog === "createVersion"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.createVersionDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.createVersionDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.createVersionDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleCreateVersion();
              }}
            >
              {createVersionMutation.isPending
                ? copy.createVersionDialog.pending
                : copy.createVersionDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={dialog === "delete"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.deleteDialog.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleteMutation.isPending ? copy.deleteDialog.pending : copy.deleteDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
