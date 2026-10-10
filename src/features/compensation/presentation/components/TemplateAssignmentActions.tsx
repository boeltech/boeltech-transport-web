import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  Ban,
  CalendarCog,
  CalendarOff,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Label } from "@shared/ui/label";
import { DateField } from "@shared/ui/form";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import {
  useDeleteTemplateAssignment,
  useUpdateTemplateAssignment,
} from "../../application/hooks";
import type { AssignmentPeriodSettledError, TemplateAssignment } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import {
  isAssignmentInUseError,
  readAssignmentPeriodSettledError,
} from "../utils/compensationLifecycleErrors";
import {
  type AssignmentDisplayStatus,
  getAssignmentDisplayStatus,
} from "../utils/getAssignmentDisplayStatus";

const copy = compensationCopy.assignmentActions;

type ActionDialog = "deactivate" | "endDate" | "delete";

type DialogError =
  | { kind: "settled"; settled: AssignmentPeriodSettledError }
  | { kind: "inUse" }
  | { kind: "other"; message: string };

function readDialogError(error: unknown): DialogError {
  if (isAssignmentInUseError(error)) return { kind: "inUse" };
  const settled = readAssignmentPeriodSettledError(error);
  return settled ? { kind: "settled", settled } : { kind: "other", message: getErrorMessage(error) };
}

function dialogErrorTitle(error: DialogError): string | null {
  if (error.kind === "settled") return copy.settledTitle;
  if (error.kind === "inUse") return copy.inUseError.title;
  return null;
}

function dialogErrorMessage(error: DialogError, status: AssignmentDisplayStatus): string {
  if (error.kind === "settled") return error.settled.message;
  if (error.kind === "inUse") {
    return status === "deactivated"
      ? copy.inUseError.deactivated
      : copy.inUseError.notDeactivated;
  }
  return error.message;
}

/** PRD D13: fecha con la que abre el diálogo de fin según el estado. */
function initialEndDate(
  assignment: TemplateAssignment,
  status: AssignmentDisplayStatus,
): string {
  if (status === "scheduled") return assignment.effectiveTo ?? assignment.effectiveFrom;
  if (status === "concluded") return assignment.effectiveTo ?? getTodayString();
  return getTodayString();
}

function endDateDescription(
  assignment: TemplateAssignment,
  status: AssignmentDisplayStatus,
): string {
  const dialogCopy = copy.closeValidityDialog;
  if (status === "scheduled") {
    return dialogCopy.scheduledDescription(formatDate(assignment.effectiveFrom));
  }
  if (status === "concluded") {
    return dialogCopy.concludedDescription(formatDate(assignment.effectiveTo));
  }
  return dialogCopy.currentDescription(
    assignment.employeeFullName ?? dialogCopy.unnamedOperator,
  );
}

function DialogErrorAlert({
  error,
  status,
  action,
}: {
  error: DialogError;
  status: AssignmentDisplayStatus;
  action?: ReactNode;
}) {
  const title = dialogErrorTitle(error);
  return (
    <Alert variant="destructive" data-testid="assignment-action-error">
      <AlertCircle className="h-4 w-4" />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>
        <p>{dialogErrorMessage(error, status)}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </AlertDescription>
    </Alert>
  );
}

interface TemplateAssignmentActionsProps {
  assignment: TemplateAssignment;
  /** Ya calculado por la tabla; si falta, se calcula con hoy (CDMX). */
  displayStatus?: AssignmentDisplayStatus;
  onActionComplete?: () => void;
}

export function TemplateAssignmentActions({
  assignment,
  displayStatus,
  onActionComplete,
}: TemplateAssignmentActionsProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("settlements", "update");
  const canDelete = hasPermission("settlements", "delete");

  const updateMutation = useUpdateTemplateAssignment();
  const deleteMutation = useDeleteTemplateAssignment();

  const [openDialog, setOpenDialog] = useState<ActionDialog | null>(null);
  const [dialogError, setDialogError] = useState<DialogError | null>(null);
  const [endDate, setEndDate] = useState(() => getTodayString());

  const status = displayStatus ?? getAssignmentDisplayStatus(assignment);
  const showUpdateItems = canUpdate && status !== "deactivated";
  const showDeleteItem = canDelete && assignment.isUsedInSettlement !== true;
  const showMenu = showUpdateItems || showDeleteItem;

  // Con un diálogo abierto, recargar la fila (p. ej. tras 409 en uso) no debe desmontarlo.
  if (!showMenu && openDialog === null) {
    return null;
  }

  const showDialog = (dialog: ActionDialog | null) => {
    setDialogError(null);
    setOpenDialog(dialog);
  };

  const showEndDateDialog = (date: string) => {
    setEndDate(date);
    showDialog("endDate");
  };

  const handleOpenChange = (dialog: ActionDialog) => (open: boolean) => {
    showDialog(open ? dialog : null);
  };

  const finish = (title: string) => {
    toast({ title, variant: "success" });
    showDialog(null);
    onActionComplete?.();
  };

  const handleDeactivate = async () => {
    setDialogError(null);
    try {
      await updateMutation.mutateAsync({
        id: assignment.id,
        payload: { isActive: false },
      });
      finish(copy.toasts.deactivateSuccess);
    } catch (error) {
      setDialogError(readDialogError(error));
    }
  };

  const handleEndDate = async () => {
    if (!endDate) return;
    setDialogError(null);
    try {
      await updateMutation.mutateAsync({
        id: assignment.id,
        payload: { effectiveTo: endDate },
      });
      finish(copy.toasts.closeValiditySuccess);
    } catch (error) {
      setDialogError(readDialogError(error));
    }
  };

  const handleDelete = async () => {
    setDialogError(null);
    try {
      await deleteMutation.mutateAsync(assignment.id);
      finish(copy.toasts.deleteSuccess);
    } catch (error) {
      setDialogError(readDialogError(error));
    }
  };

  const settledError = dialogError?.kind === "settled" ? dialogError.settled : null;
  const deleteBlocked = settledError !== null || dialogError?.kind === "inUse";
  const minEffectiveTo = settledError?.minEffectiveTo ?? null;
  const isConcluded = status === "concluded";
  const endDateCopy = copy.closeValidityDialog;

  return (
    <>
      {showMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-assignment-menu-trigger>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{copy.openMenuSr}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
            {showUpdateItems ? (
              <>
                <DropdownMenuItem
                  onClick={() => showEndDateDialog(initialEndDate(assignment, status))}
                >
                  {isConcluded ? (
                    <CalendarCog className="mr-2 h-4 w-4" />
                  ) : (
                    <CalendarOff className="mr-2 h-4 w-4" />
                  )}
                  {isConcluded ? copy.changeEndDate : copy.closeValidity}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => showDialog("deactivate")}>
                  <Ban className="mr-2 h-4 w-4" />
                  {copy.deactivate}
                </DropdownMenuItem>
              </>
            ) : null}
            {showDeleteItem ? (
              <>
                {showUpdateItems ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => showDialog("delete")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {copy.delete}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      <AlertDialog
        open={openDialog === "deactivate"}
        onOpenChange={handleOpenChange("deactivate")}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deactivateDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deactivateDialog.description(
                assignment.employeeFullName ?? copy.deactivateDialog.unnamedOperator,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialogError ? (
            <DialogErrorAlert
              error={dialogError}
              status={status}
              action={
                minEffectiveTo ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => showEndDateDialog(minEffectiveTo)}
                  >
                    {copy.deactivateDialog.closeOn(formatDate(minEffectiveTo))}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>
              {copy.deactivateDialog.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeactivate();
              }}
              disabled={updateMutation.isPending || settledError !== null}
            >
              {updateMutation.isPending
                ? copy.deactivateDialog.pending
                : copy.deactivateDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={openDialog === "endDate"} onOpenChange={handleOpenChange("endDate")}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{isConcluded ? endDateCopy.changeTitle : endDateCopy.title}</DialogTitle>
            <DialogDescription>{endDateDescription(assignment, status)}</DialogDescription>
          </DialogHeader>
          {dialogError ? (
            <DialogErrorAlert
              error={dialogError}
              status={status}
              action={
                minEffectiveTo ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEndDate(minEffectiveTo)}
                  >
                    {endDateCopy.useDate(formatDate(minEffectiveTo))}
                  </Button>
                ) : undefined
              }
            />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`close-validity-${assignment.id}`}>{endDateCopy.dateLabel}</Label>
            <DateField
              id={`close-validity-${assignment.id}`}
              value={endDate}
              onChange={setEndDate}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => showDialog(null)}
              disabled={updateMutation.isPending}
            >
              {endDateCopy.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => void handleEndDate()}
              disabled={updateMutation.isPending || !endDate}
            >
              {updateMutation.isPending
                ? endDateCopy.pending
                : isConcluded
                  ? endDateCopy.changeConfirm
                  : endDateCopy.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDialog === "delete"} onOpenChange={handleOpenChange("delete")}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {dialogError ? <DialogErrorAlert error={dialogError} status={status} /> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {dialogError?.kind === "inUse" ? copy.deleteDialog.close : copy.deleteDialog.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleteMutation.isPending || deleteBlocked}
            >
              {deleteMutation.isPending ? copy.deleteDialog.pending : copy.deleteDialog.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
