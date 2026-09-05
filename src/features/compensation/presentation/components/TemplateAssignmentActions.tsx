import { useState } from "react";

import { AlertCircle, Ban, CalendarOff, MoreHorizontal, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@shared/ui/alert";
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

import {

  useDeleteTemplateAssignment,

  useUpdateTemplateAssignment,

} from "../../application/hooks";

import type { TemplateAssignment } from "../../domain/entities";

import { compensationCopy } from "../copy/compensationCopy";



const copy = compensationCopy.assignmentActions;



interface TemplateAssignmentActionsProps {

  assignment: TemplateAssignment;

  onActionComplete?: () => void;

}



export function TemplateAssignmentActions({

  assignment,

  onActionComplete,

}: TemplateAssignmentActionsProps) {

  const { toast } = useToast();

  const { hasPermission } = usePermissions();

  const canUpdate = hasPermission("settlements", "update");

  const canDelete = hasPermission("settlements", "delete");



  const updateMutation = useUpdateTemplateAssignment();

  const deleteMutation = useDeleteTemplateAssignment();



  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const [closeValidityDialogOpen, setCloseValidityDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [closeValidityDate, setCloseValidityDate] = useState(

    () => new Date().toISOString().slice(0, 10),

  );

  const [closeValidityApiError, setCloseValidityApiError] = useState<string | null>(null);



  if (!canUpdate && !canDelete) {

    return null;

  }



  const handleDeactivate = async () => {

    try {

      await updateMutation.mutateAsync({

        id: assignment.id,

        payload: { isActive: false },

      });

      toast({ title: copy.toasts.deactivateSuccess, variant: "success" });

      setDeactivateDialogOpen(false);

      onActionComplete?.();

    } catch (error) {

      toast({

        title: copy.toasts.deactivateError,

        description: getErrorMessage(error),

        variant: "error",

      });

    }

  };



  const handleCloseValidity = async () => {

    if (!closeValidityDate) return;

    setCloseValidityApiError(null);

    try {

      await updateMutation.mutateAsync({

        id: assignment.id,

        payload: { effectiveTo: closeValidityDate },

      });

      toast({ title: copy.toasts.closeValiditySuccess, variant: "success" });

      setCloseValidityDialogOpen(false);

      onActionComplete?.();

    } catch (error) {

      const message = getErrorMessage(error);

      setCloseValidityApiError(message);

      toast({

        title: copy.toasts.closeValidityError,

        variant: "error",

      });

    }

  };



  const handleDelete = async () => {

    try {

      await deleteMutation.mutateAsync(assignment.id);

      toast({ title: copy.toasts.deleteSuccess, variant: "success" });

      setDeleteDialogOpen(false);

      onActionComplete?.();

    } catch (error) {

      toast({

        title: copy.toasts.deleteError,

        description: getErrorMessage(error),

        variant: "error",

      });

    }

  };



  return (

    <>

      <DropdownMenu>

        <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>

          <Button variant="ghost" size="icon" className="h-8 w-8">

            <MoreHorizontal className="h-4 w-4" />

            <span className="sr-only">{copy.openMenuSr}</span>

          </Button>

        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>

          {canUpdate && assignment.isActive && (

            <>

              <DropdownMenuItem onClick={() => setDeactivateDialogOpen(true)}>

                <Ban className="mr-2 h-4 w-4" />

                {copy.deactivate}

              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setCloseValidityApiError(null);
                  setCloseValidityDialogOpen(true);
                }}
              >

                <CalendarOff className="mr-2 h-4 w-4" />

                {copy.closeValidity}

              </DropdownMenuItem>

            </>

          )}

          {canDelete && (

            <>

              {canUpdate && assignment.isActive && <DropdownMenuSeparator />}

              <DropdownMenuItem

                className="text-destructive focus:text-destructive"

                onClick={() => setDeleteDialogOpen(true)}

              >

                <Trash2 className="mr-2 h-4 w-4" />

                {copy.delete}

              </DropdownMenuItem>

            </>

          )}

        </DropdownMenuContent>

      </DropdownMenu>



      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>

        <AlertDialogContent onClick={(e) => e.stopPropagation()}>

          <AlertDialogHeader>

            <AlertDialogTitle>{copy.deactivateDialog.title}</AlertDialogTitle>

            <AlertDialogDescription>{copy.deactivateDialog.description}</AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel disabled={updateMutation.isPending}>

              {copy.deactivateDialog.cancel}

            </AlertDialogCancel>

            <AlertDialogAction

              onClick={(event) => {

                event.preventDefault();

                void handleDeactivate();

              }}

              disabled={updateMutation.isPending}

            >

              {updateMutation.isPending

                ? copy.deactivateDialog.pending

                : copy.deactivateDialog.confirm}

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>



      <Dialog
        open={closeValidityDialogOpen}
        onOpenChange={(open) => {
          setCloseValidityDialogOpen(open);
          if (!open) setCloseValidityApiError(null);
        }}
      >

        <DialogContent onClick={(e) => e.stopPropagation()}>

          <DialogHeader>

            <DialogTitle>{copy.closeValidityDialog.title}</DialogTitle>

            <DialogDescription>{copy.closeValidityDialog.description}</DialogDescription>

          </DialogHeader>

          {closeValidityApiError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{closeValidityApiError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">

            <Label htmlFor={`close-validity-${assignment.id}`}>

              {copy.closeValidityDialog.dateLabel}

            </Label>

            <DateField

              id={`close-validity-${assignment.id}`}

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

              {copy.closeValidityDialog.cancel}

            </Button>

            <Button

              type="button"

              onClick={() => void handleCloseValidity()}

              disabled={updateMutation.isPending || !closeValidityDate}

            >

              {updateMutation.isPending

                ? copy.closeValidityDialog.pending

                : copy.closeValidityDialog.confirm}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>



      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>

        <AlertDialogContent onClick={(e) => e.stopPropagation()}>

          <AlertDialogHeader>

            <AlertDialogTitle>{copy.deleteDialog.title}</AlertDialogTitle>

            <AlertDialogDescription>{copy.deleteDialog.description}</AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel disabled={deleteMutation.isPending}>

              {copy.deleteDialog.cancel}

            </AlertDialogCancel>

            <AlertDialogAction

              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"

              onClick={(event) => {

                event.preventDefault();

                void handleDelete();

              }}

              disabled={deleteMutation.isPending}

            >

              {deleteMutation.isPending ? copy.deleteDialog.pending : copy.deleteDialog.confirm}

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </>

  );

}


