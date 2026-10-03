import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CopyPlus,
  MoreHorizontal,
  PauseCircle,
  Trash2,
} from "lucide-react";
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
import type { CompensationTemplate } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { getCompensationLifecycleErrorMessage } from "../utils/compensationLifecycleErrors";

const copy = compensationCopy.templateActions;

interface CompensationTemplateActionsProps {
  template: CompensationTemplate;
  onDeleted?: () => void;
  /** Si true, tras crear versión navega al builder del draft. Default true. */
  navigateOnVersionCreate?: boolean;
}

type DialogKind = "activate" | "deactivate" | "createVersion" | "delete" | null;

export function CompensationTemplateActions({
  template,
  onDeleted,
  navigateOnVersionCreate = true,
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

  const canActivate =
    canUpdate && (template.status === "draft" || template.status === "inactive");
  const canDeactivate = canUpdate && template.status === "active";
  const canCreateVersion =
    canUpdate && (template.lockedForEdit || template.status === "active");

  if (!canUpdate && !canDelete) {
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{copy.openMenuSr}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56"
          onClick={(event) => event.stopPropagation()}
        >
          {canActivate ? (
            <DropdownMenuItem onClick={() => setDialog("activate")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {copy.activate}
            </DropdownMenuItem>
          ) : null}
          {canDeactivate ? (
            <DropdownMenuItem onClick={() => setDialog("deactivate")}>
              <PauseCircle className="mr-2 h-4 w-4" />
              {copy.deactivate}
            </DropdownMenuItem>
          ) : null}
          {canCreateVersion ? (
            <DropdownMenuItem onClick={() => setDialog("createVersion")}>
              <CopyPlus className="mr-2 h-4 w-4" />
              {copy.createVersion}
            </DropdownMenuItem>
          ) : null}
          {canDelete ? (
            <>
              {(canActivate || canDeactivate || canCreateVersion) && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDialog("delete")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {copy.delete}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={dialog === "activate"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.activateDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.activateDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {template.version > 1 ? (
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
    </>
  );
}
