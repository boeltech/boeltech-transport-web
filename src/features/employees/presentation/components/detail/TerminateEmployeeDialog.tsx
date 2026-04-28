import { memo, useState } from "react";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import { useToast } from "@shared/hooks";
import { useTerminateEmployee } from "../../../application/hooks/useEmployees";

interface TerminateEmployeeDialogProps {
  employeeId: string;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TerminateEmployeeDialog = memo(function TerminateEmployeeDialog({
  employeeId,
  employeeName,
  open,
  onOpenChange,
}: TerminateEmployeeDialogProps) {
  const { toast } = useToast();
  const terminateMutation = useTerminateEmployee();
  const [terminationDate, setTerminationDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [terminationReason, setTerminationReason] = useState("");

  const handleTerminate = async () => {
    if (!employeeId || !terminationDate) return;
    try {
      await terminateMutation.mutateAsync({
        id: employeeId,
        data: {
          termination_date: terminationDate,
          termination_reason: terminationReason || undefined,
        },
      });
      toast({ title: "Empleado dado de baja correctamente" });
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        title: "Error al dar de baja",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar de baja a {employeeName}</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El empleado quedará inactivo en el
            sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="termination_date">Fecha de baja *</Label>
            <Input
              id="termination_date"
              type="date"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="termination_reason">Motivo (opcional)</Label>
            <Textarea
              id="termination_reason"
              placeholder="Describe el motivo de la baja..."
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!terminationDate || terminateMutation.isPending}
            onClick={handleTerminate}
          >
            {terminateMutation.isPending ? "Procesando..." : "Confirmar baja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

