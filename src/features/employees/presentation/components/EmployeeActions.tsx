/**
 * EmployeeActions
 *
 * - dropdown (lista): ver / editar — sin Dar de baja (D1).
 * - buttons (detalle): Editar primary; Dar de baja outline (D6).
 * Errores de baja: Alert inline en Dialog (D10). Copy sin prometer reactivación (D12).
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMasterActionFrom } from "@shared/utils/masterWayfinding";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Label } from "@shared/ui/label";
import { DateField } from "@shared/ui/form";
import { Textarea } from "@shared/ui/text-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { getErrorMessage, isApiError } from "@shared/api/interceptors/error-handler";
import { cn } from "@shared/lib/utils/cn";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  Loader2,
} from "lucide-react";

import { useTerminateEmployee } from "../../application/hooks/useEmployees";
import type { EmployeeListItem, TerminateEmployeeDTO } from "../../domain/entities";
import { employeesCopy } from "../copy/employeesCopy";

const actionsCopy = employeesCopy.detail.actions;

const EMPLOYEE_DRIVER_TERMINATION_CODES = new Set([
  "EMPLOYEE_DRIVER_ON_TRIP",
  "EMPLOYEE_DRIVER_HAS_ACTIVE_TRIPS",
  "EMPLOYEE_IS_ACTIVE_DRIVER",
]);

function terminationErrorDescription(error: unknown): string {
  const message = getErrorMessage(error);
  if (isApiError(error) && error.code && EMPLOYEE_DRIVER_TERMINATION_CODES.has(error.code)) {
    return `${message} ${actionsCopy.terminateErrorDriverHint}`;
  }
  return message;
}

export interface EmployeeActionsProps {
  employee: EmployeeListItem;
  variant?: "dropdown" | "buttons";
  onActionComplete?: () => void;
  /** Clase del trigger ⋯ (p. ej. entityListCardMenuTriggerClassName en cards). */
  menuTriggerClassName?: string;
  /** aria-label del trigger ⋯. */
  menuAriaLabel?: string;
}

export function EmployeeActions({
  employee,
  variant = "dropdown",
  onActionComplete,
  menuTriggerClassName,
  menuAriaLabel = employeesCopy.list.card.actionsAria,
}: EmployeeActionsProps) {
  const { id, fullName, status } = employee;
  const navigate = useNavigate();
  const fromState = useMasterActionFrom("/employees");
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const canUpdate = hasPermission("employees", "update");
  const canTerminate = hasPermission("employees", "delete");
  const isAlreadyTerminated = status === "terminated";
  /** Baja solo en detalle (D1). */
  const canTerminateInDetail =
    variant === "buttons" && canTerminate && !isAlreadyTerminated;

  const [terminateDialog, setTerminateDialog] = useState(false);
  const [terminateError, setTerminateError] = useState<string | null>(null);
  const [terminationDate, setTerminationDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [terminationReason, setTerminationReason] = useState("");

  const terminateMutation = useTerminateEmployee();

  const handleView = () => {
    navigate(`/employees/${id}`, { state: fromState });
  };

  const handleEdit = () => {
    navigate(`/employees/${id}/edit`, { state: fromState });
  };

  const openTerminateDialog = () => {
    setTerminateError(null);
    setTerminateDialog(true);
  };

  const closeTerminateDialog = () => {
    if (terminateMutation.isPending) return;
    setTerminateError(null);
    setTerminateDialog(false);
  };

  const handleTerminateConfirm = async () => {
    if (terminateMutation.isPending || !terminationDate) return;
    setTerminateError(null);
    const dto: TerminateEmployeeDTO = {
      termination_date: terminationDate,
      termination_reason: terminationReason || undefined,
    };
    try {
      await terminateMutation.mutateAsync({ id, data: dto });
      toast({ title: actionsCopy.terminateSuccess, variant: "success" });
      setTerminateDialog(false);
      setTerminationReason("");
      setTerminateError(null);
      onActionComplete?.();
    } catch (error: unknown) {
      setTerminateError(terminationErrorDescription(error));
    }
  };

  const terminateDialogNode = (
    <Dialog
      open={terminateDialog}
      onOpenChange={(open) => {
        if (!open) closeTerminateDialog();
        else openTerminateDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionsCopy.terminateTitle}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{actionsCopy.terminateDescription(fullName)}</p>
              <p>{actionsCopy.terminateDriverNote}</p>
              <p>
                {actionsCopy.terminateTripsHintPrefix}{" "}
                <Link
                  to="/trips"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {actionsCopy.linkTrips}
                </Link>{" "}
                {actionsCopy.terminateTripsHintOr}{" "}
                <Link
                  to="/drivers"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {actionsCopy.linkDrivers}
                </Link>
                .
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        {terminateError ? (
          <Alert variant="destructive">
            <AlertTitle>{actionsCopy.terminateErrorTitle}</AlertTitle>
            <AlertDescription className="select-text whitespace-pre-wrap break-words">
              {terminateError}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="termination-date">{actionsCopy.terminationDate}</Label>
            <DateField
              id="termination-date"
              value={terminationDate}
              onChange={setTerminationDate}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="termination-reason">
              {actionsCopy.terminationReason}
            </Label>
            <Textarea
              id="termination-reason"
              placeholder={actionsCopy.terminationReasonPlaceholder}
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeTerminateDialog}
            disabled={terminateMutation.isPending}
          >
            {actionsCopy.cancel}
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleTerminateConfirm()}
            disabled={terminateMutation.isPending || !terminationDate}
          >
            {terminateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {terminateMutation.isPending
              ? actionsCopy.terminating
              : actionsCopy.terminate}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8", menuTriggerClassName)}
              disabled={terminateMutation.isPending}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{menuAriaLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-4 w-4" />
              {actionsCopy.viewDetail}
            </DropdownMenuItem>

            {canUpdate && !isAlreadyTerminated ? (
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                {actionsCopy.edit}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  const hasNoActions =
    isAlreadyTerminated || (!canUpdate && !canTerminateInDetail);
  if (hasNoActions) return null;

  return (
    <>
      <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
        {canUpdate && !isAlreadyTerminated ? (
          <Button
            variant="default"
            size="sm"
            onClick={handleEdit}
            disabled={terminateMutation.isPending}
          >
            <Pencil className="mr-2 h-4 w-4" />
            {actionsCopy.edit}
          </Button>
        ) : null}

        {canTerminateInDetail ? (
          <Button
            variant="outline"
            size="sm"
            onClick={openTerminateDialog}
            disabled={terminateMutation.isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {terminateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserX className="mr-2 h-4 w-4" />
            )}
            {actionsCopy.terminate}
          </Button>
        ) : null}
      </div>

      {terminateDialogNode}
    </>
  );
}
