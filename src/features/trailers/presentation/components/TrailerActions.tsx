/**

 * TrailerActions — Editar visible en la fila; estado y Eliminar en menú (D6/D7).

 * Lifecycle UI: available ↔ out_of_service. No mutar reserved / on_trip.

 * Baja siempre vía AlertDialog; nunca a un clic ni como primaria sólida.

 */



import { useState } from "react";

import {

  CheckCircle,

  Loader2,

  MoreHorizontal,

  Trash2,

  XCircle,

} from "lucide-react";

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

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "@shared/ui/dialog";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "@shared/ui/dropdown-menu";

import { cn } from "@shared/lib/utils/cn";

import { usePermissions } from "@shared/permissions";

import { useToast } from "@shared/hooks";

import {

  getErrorMessage,

  isApiError,

} from "@shared/api/interceptors/error-handler";

import { useDeleteTrailer, useUpdateTrailerStatus } from "../../application";

import {

  TRAILER_STATUS_LABELS,

  TrailerStatus,

  type TrailerStatusType,

} from "../../domain";

import { trailersCopy } from "../copy/trailersCopy";



const statusCopy = trailersCopy.statusChange;



/** Solo available ↔ out_of_service desde UI (D6). */

function statusTransitionTarget(

  status: TrailerStatusType,

): TrailerStatusType | null {

  if (status === TrailerStatus.AVAILABLE) return TrailerStatus.OUT_OF_SERVICE;

  if (status === TrailerStatus.OUT_OF_SERVICE) return TrailerStatus.AVAILABLE;

  return null;

}



export interface TrailerActionsProps {

  trailerId: string;

  licensePlate: string;

  status: TrailerStatusType;

  onEdit?: () => void;

  /** Clase del trigger ⋯ (p. ej. entityListCardMenuTriggerClassName en cards). */

  menuTriggerClassName?: string;

}



export function TrailerActions({

  trailerId,

  licensePlate,

  status,

  onEdit,

  menuTriggerClassName,

}: TrailerActionsProps) {

  const { toast } = useToast();

  const { hasPermission } = usePermissions();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [statusError, setStatusError] = useState<string | null>(null);



  const canEdit = hasPermission("trailers", "update");

  const canDelete = hasPermission("trailers", "delete");

  const targetStatus = canEdit ? statusTransitionTarget(status) : null;

  const showStatusAction = targetStatus !== null;

  const showMenu = canDelete || showStatusAction;



  const updateStatus = useUpdateTrailerStatus({

    onSuccess: () => {

      const label = targetStatus

        ? TRAILER_STATUS_LABELS[targetStatus]

        : "";

      toast({

        title: statusCopy.successTitle,

        description: statusCopy.successDescription(licensePlate, label),

        variant: "success",

      });

      setStatusError(null);

      setStatusDialogOpen(false);

    },

    onError: (error) => {

      setStatusError(

        isApiError(error) ? error.getDetailedMessage(3) : getErrorMessage(error),

      );

    },

  });



  const deleteTrailer = useDeleteTrailer({

    onSuccess: () => {

      toast({

        title: trailersCopy.form.toast.deleteSuccess,

        variant: "success",

      });

      setConfirmDeleteOpen(false);

    },

    onError: (error) => {

      toast({

        title: trailersCopy.form.toast.deleteErrorTitle,

        description: isApiError(error)

          ? error.getDetailedMessage(3)

          : getErrorMessage(error),

        variant: "destructive",

      });

    },

  });



  const openStatusDialog = () => {

    setStatusError(null);

    setStatusDialogOpen(true);

  };



  const closeStatusDialog = () => {

    if (updateStatus.isPending) return;

    setStatusError(null);

    setStatusDialogOpen(false);

  };



  const handleStatusConfirm = () => {

    if (!targetStatus || updateStatus.isPending) return;

    setStatusError(null);

    updateStatus.mutate({ id: trailerId, status: targetStatus });

  };



  if (!canEdit && !canDelete) {

    return <span className="text-muted-foreground">—</span>;

  }



  const statusActionLabel =

    targetStatus === TrailerStatus.OUT_OF_SERVICE

      ? trailersCopy.actions.markOutOfService

      : trailersCopy.actions.markAvailable;

  const StatusActionIcon =

    targetStatus === TrailerStatus.OUT_OF_SERVICE ? XCircle : CheckCircle;

  const statusActionColor =

    targetStatus === TrailerStatus.OUT_OF_SERVICE

      ? "text-destructive"

      : "text-success";



  return (

    <>

      <div className="flex items-center justify-end gap-1">

        {canEdit && onEdit ? (

          <Button type="button" variant="outline" size="sm" onClick={onEdit}>

            {trailersCopy.actions.edit}

          </Button>

        ) : null}

        {showMenu ? (

          <DropdownMenu>

            <DropdownMenuTrigger asChild>

              <Button

                variant="ghost"

                size="icon"

                className={cn("h-8 w-8", menuTriggerClassName)}

              >

                <MoreHorizontal className="h-4 w-4" />

                <span className="sr-only">{trailersCopy.actions.menu}</span>

              </Button>

            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">

              {showStatusAction ? (

                <DropdownMenuItem onSelect={openStatusDialog}>

                  <StatusActionIcon

                    className={cn("mr-2 h-4 w-4", statusActionColor)}

                  />

                  {statusActionLabel}

                </DropdownMenuItem>

              ) : null}

              {showStatusAction && canDelete ? <DropdownMenuSeparator /> : null}

              {canDelete ? (

                <DropdownMenuItem

                  className="text-destructive focus:text-destructive focus:bg-destructive/10"

                  onSelect={() => setConfirmDeleteOpen(true)}

                >

                  <Trash2 className="mr-2 h-4 w-4" />

                  {trailersCopy.actions.delete}

                </DropdownMenuItem>

              ) : null}

            </DropdownMenuContent>

          </DropdownMenu>

        ) : null}

      </div>



      <AlertDialog

        open={confirmDeleteOpen}

        onOpenChange={(open) => {

          if (deleteTrailer.isPending) return;

          setConfirmDeleteOpen(open);

        }}

      >

        <AlertDialogContent>

          <AlertDialogHeader>

            <AlertDialogTitle>

              {trailersCopy.actions.deleteTitle(licensePlate)}

            </AlertDialogTitle>

            <AlertDialogDescription>

              {trailersCopy.actions.deleteDescription}

            </AlertDialogDescription>

          </AlertDialogHeader>

          <AlertDialogFooter>

            <AlertDialogCancel disabled={deleteTrailer.isPending}>

              {trailersCopy.form.cancel}

            </AlertDialogCancel>

            <AlertDialogAction

              disabled={deleteTrailer.isPending}

              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"

              onClick={(event) => {

                event.preventDefault();

                deleteTrailer.mutate(trailerId);

              }}

            >

              {deleteTrailer.isPending ? (

                <>

                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                  {trailersCopy.actions.deleting}

                </>

              ) : (

                trailersCopy.actions.delete

              )}

            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>



      <Dialog

        open={statusDialogOpen}

        onOpenChange={(open) => {

          if (!open) closeStatusDialog();

          else setStatusDialogOpen(true);

        }}

      >

        <DialogContent>

          <DialogHeader>

            <DialogTitle>{statusCopy.title}</DialogTitle>

            <DialogDescription>

              {targetStatus

                ? statusCopy.description(

                    licensePlate,

                    TRAILER_STATUS_LABELS[status],

                    TRAILER_STATUS_LABELS[targetStatus],

                  )

                : null}

            </DialogDescription>

          </DialogHeader>

          {statusError ? (

            <Alert variant="destructive">

              <AlertTitle>{statusCopy.errorTitle}</AlertTitle>

              <AlertDescription className="select-text whitespace-pre-wrap break-words">

                {statusError}

              </AlertDescription>

            </Alert>

          ) : null}

          <DialogFooter>

            <Button

              variant="outline"

              onClick={closeStatusDialog}

              disabled={updateStatus.isPending}

            >

              {statusCopy.cancel}

            </Button>

            <Button

              onClick={handleStatusConfirm}

              disabled={updateStatus.isPending || !targetStatus}

            >

              {updateStatus.isPending ? (

                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              ) : null}

              {statusCopy.confirm}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </>

  );

}


