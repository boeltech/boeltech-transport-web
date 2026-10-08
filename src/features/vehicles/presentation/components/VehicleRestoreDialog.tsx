import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { useToast } from "@shared/hooks";
import { useRestoreVehicle } from "../../application";
import { isBillableMotrizType, type RestoreVehicleResult } from "../../domain";
import { vehiclesCopy } from "../copy";
import {
  toRestoreErrorView,
  type RestoreErrorView,
} from "../utils/vehicleLifecycleErrors";
import { VehicleBillingPolicyNote } from "./VehicleBillingPolicyNote";
import type { VehicleLifecycleTarget } from "./vehicleLifecycleTarget";

const copy = vehiclesCopy.restore;

interface VehicleRestoreDialogProps {
  vehicle: VehicleLifecycleTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestored?: (result: RestoreVehicleResult) => void;
}

/** PRD D6 — confirmación «Restaurar»; la unidad vuelve como Disponible. */
export function VehicleRestoreDialog({
  vehicle,
  open,
  onOpenChange,
  onRestored,
}: VehicleRestoreDialogProps) {
  const { toast } = useToast();
  const [errorView, setErrorView] = useState<RestoreErrorView | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (!next) setErrorView(null);
    onOpenChange(next);
  };

  const unitNumber = vehicle?.unitNumber ?? "";

  const mutation = useRestoreVehicle({
    onSuccess: (result) => {
      const branchWarning = result.warnings.find(
        (warning) => warning.code === "VEHICLE_BRANCH_CLEARED",
      );
      if (branchWarning) {
        toast({
          title: copy.branchClearedTitle(unitNumber),
          description: `${branchWarning.message} ${copy.branchClearedHint}`,
          variant: "warning",
        });
      } else {
        toast({
          title: copy.successToast(unitNumber),
          description: copy.successDescription,
          variant: "success",
        });
      }
      handleOpenChange(false);
      onRestored?.(result);
    },
    onError: (error) => {
      setErrorView(toRestoreErrorView(error));
    },
  });

  const handleConfirm = (event: MouseEvent) => {
    event.preventDefault();
    if (!vehicle || mutation.isPending) return;
    setErrorView(null);
    mutation.mutate(vehicle.id);
  };

  const showBillingNote = vehicle ? isBillableMotrizType(vehicle.type) : false;
  const closeDialog = () => handleOpenChange(false);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title(unitNumber)}</AlertDialogTitle>
          <AlertDialogDescription>
            {copy.descriptionLead} <strong>{copy.descriptionStatus}</strong>{" "}
            {copy.descriptionTail}
            {showBillingNote ? (
              <>
                {" "}
                <VehicleBillingPolicyNote kind="create" />
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorView ? (
          <RestoreErrorAlert view={errorView} onNavigate={closeDialog} />
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>{copy.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {copy.submitting}
              </>
            ) : (
              copy.confirm
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RestoreErrorAlert({
  view,
  onNavigate,
}: {
  view: RestoreErrorView;
  onNavigate: () => void;
}) {
  if (view.kind === "conflict") {
    const lead =
      view.field === "unit_number"
        ? copy.conflictUnitNumber(view.value)
        : copy.conflictLicensePlate(view.value);
    return (
      <Alert variant="destructive">
        <AlertTitle>{copy.errorTitle}</AlertTitle>
        <AlertDescription className="select-text break-words">
          {lead}{" "}
          {view.conflictingVehicleId ? (
            <>
              <Link
                to={`/vehicles/${view.conflictingVehicleId}`}
                onClick={onNavigate}
                className="font-medium underline underline-offset-2"
              >
                {copy.conflictViewUnit}
              </Link>
              .{" "}
            </>
          ) : null}
          {copy.conflictHint}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>{copy.errorTitle}</AlertTitle>
      <AlertDescription className="select-text whitespace-pre-wrap break-words">
        {view.kind === "not_operable" ? copy.notOperable(view.message) : view.message}
      </AlertDescription>
    </Alert>
  );
}
