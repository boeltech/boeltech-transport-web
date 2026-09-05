/**
 * CompensationAgreementActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Menú de acciones contextuales para acuerdos de compensación.
 * Ubicación: src/features/settlements/presentation/components/CompensationAgreementActions.tsx
 */

import { useState } from "react";
import {
  Ban,
  CalendarOff,
  Eye,
  MoreHorizontal,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { settlementCreatePath } from "../../application/settlementsRoutes";
import {
  useDeleteCompensationAgreement,
  useUpdateCompensationAgreement,
} from "../../application/hooks/useAgreements";
import type { CompensationAgreement } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy;
const governanceCopy = settlementsCopy.agreementGovernance;

interface CompensationAgreementActionsProps {
  agreement: CompensationAgreement;
  onActionComplete?: () => void;
}

export function CompensationAgreementActions({
  agreement,
  onActionComplete,
}: CompensationAgreementActionsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const canReadEmployees = hasPermission("employees", "read");
  const canCreateSettlements = hasPermission("settlements", "create");
  const canUpdate = hasPermission("settlements", "update");
  const canDelete = hasPermission("settlements", "delete");

  const updateMutation = useUpdateCompensationAgreement();
  const deleteMutation = useDeleteCompensationAgreement();

  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [closeValidityDialogOpen, setCloseValidityDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [closeValidityDate, setCloseValidityDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  const hasGovernanceActions =
    (canUpdate && agreement.isActive) || (canDelete && agreement.isActive);

  if (
    !canReadEmployees &&
    !canCreateSettlements &&
    !hasGovernanceActions &&
    !(canDelete && !agreement.isActive)
  ) {
    return null;
  }

  const handleDeactivate = async () => {
    try {
      await updateMutation.mutateAsync({
        id: agreement.id,
        employeeId: agreement.employeeId,
        isActive: false,
      });
      toast({
        title: governanceCopy.toasts.deactivateSuccess,
        variant: "success",
      });
      setDeactivateDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: governanceCopy.toasts.deactivateError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleCloseValidity = async () => {
    if (!closeValidityDate) return;

    try {
      await updateMutation.mutateAsync({
        id: agreement.id,
        employeeId: agreement.employeeId,
        effectiveTo: closeValidityDate,
      });
      toast({
        title: governanceCopy.toasts.closeValiditySuccess,
        variant: "success",
      });
      setCloseValidityDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: governanceCopy.toasts.closeValidityError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        id: agreement.id,
        employeeId: agreement.employeeId,
      });
      toast({
        title: governanceCopy.toasts.deleteSuccess,
        variant: "success",
      });
      setDeleteDialogOpen(false);
      onActionComplete?.();
    } catch (error) {
      toast({
        title: governanceCopy.toasts.deleteError,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{copy.actions.openActionsMenuSr}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {canReadEmployees && (
            <DropdownMenuItem asChild>
              <Link to={`/employees/${agreement.employeeId}`}>
                <Eye className="mr-2 h-4 w-4" />
                {copy.actions.viewDriverFile}
              </Link>
            </DropdownMenuItem>
          )}
          {canCreateSettlements && (
            <DropdownMenuItem
              onClick={() =>
                navigate(settlementCreatePath({ employeeId: agreement.employeeId }))
              }
            >
              <PlusCircle className="mr-2 h-4 w-4 text-primary" />
              {copy.actions.createSettlement}
            </DropdownMenuItem>
          )}

          {(canUpdate || canDelete) &&
            (canReadEmployees || canCreateSettlements) && (
              <DropdownMenuSeparator />
            )}

          {canUpdate && agreement.isActive && (
            <>
              <DropdownMenuItem onClick={() => setDeactivateDialogOpen(true)}>
                <Ban className="mr-2 h-4 w-4" />
                {governanceCopy.actions.deactivate}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCloseValidityDialogOpen(true)}>
                <CalendarOff className="mr-2 h-4 w-4" />
                {governanceCopy.actions.closeValidity}
              </DropdownMenuItem>
            </>
          )}

          {canDelete && (
            <>
              {(canUpdate && agreement.isActive) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {governanceCopy.actions.delete}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.actionDialogs.deactivateAgreement.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.actionDialogs.deactivateAgreement.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>
              {copy.actionDialogs.deactivateAgreement.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDeactivate();
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? copy.actionDialogs.deactivateAgreement.pending
                : copy.actionDialogs.deactivateAgreement.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={closeValidityDialogOpen} onOpenChange={setCloseValidityDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{copy.actionDialogs.closeAgreementValidity.title}</DialogTitle>
            <DialogDescription>
              {copy.actionDialogs.closeAgreementValidity.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor={`close-validity-${agreement.id}`}>
              {copy.actionDialogs.closeAgreementValidity.dateLabel}
            </Label>
            <DateField
              id={`close-validity-${agreement.id}`}
              value={closeValidityDate}
              onChange={setCloseValidityDate}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCloseValidityDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              {copy.actionDialogs.closeAgreementValidity.cancel}
            </Button>
            <Button
              type="button"
              onClick={() => void handleCloseValidity()}
              disabled={updateMutation.isPending || !closeValidityDate}
            >
              {updateMutation.isPending
                ? copy.actionDialogs.closeAgreementValidity.pending
                : copy.actionDialogs.closeAgreementValidity.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.actionDialogs.deleteAgreement.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.actionDialogs.deleteAgreement.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {copy.actionDialogs.deleteAgreement.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? copy.actionDialogs.deleteAgreement.pending
                : copy.actionDialogs.deleteAgreement.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
