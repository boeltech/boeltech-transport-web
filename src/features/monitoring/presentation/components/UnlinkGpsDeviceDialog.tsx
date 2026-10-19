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
import { useToast } from "@shared/hooks";
import { useUnlinkGpsDevice } from "../../application";
import { monitoringCopy } from "../copy/monitoringCopy";

export interface UnlinkGpsDeviceDialogProps {
  readonly vehicleId: string;
  readonly vehicleLabel: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function UnlinkGpsDeviceDialog({
  vehicleId,
  vehicleLabel,
  open,
  onOpenChange,
}: UnlinkGpsDeviceDialogProps) {
  const copy = monitoringCopy.unlinkDialog;
  const { toast } = useToast();

  const unlinkMutation = useUnlinkGpsDevice(vehicleId, {
    onSuccess: () => {
      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.errorGeneric,
        description: error.message,
        variant: "error",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">{copy.description(vehicleLabel)}</span>
            <span className="block">{copy.consequence}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={unlinkMutation.isPending}>
            {copy.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={unlinkMutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              unlinkMutation.mutate();
            }}
          >
            {unlinkMutation.isPending ? copy.confirming : copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
