/**
 * EmployeeActions
 * Clean Architecture - Presentation Layer (Components)
 *
 * Menú de acciones para un empleado individual.
 * Dos modos:
 *   1. variant="dropdown" — para EmployeeTable (ícono ⋯ con menú)
 *   2. variant="buttons"  — para EmployeeDetailPage (botones visibles)
 *
 * Ubicación: src/features/employees/presentation/components/EmployeeActions.tsx
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Label } from "@shared/ui/label";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { useTerminateEmployee } from "../../application/hooks/useEmployees";
import type { EmployeeListItem, TerminateEmployeeDTO } from "../../domain/entities";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  Loader2,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeActionsProps {
  employee: EmployeeListItem;
  variant?: "dropdown" | "buttons";
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onTerminate?: (id: string) => void;
  onActionComplete?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeActions({
  employee,
  variant = "dropdown",
  onView,
  onEdit,
  onTerminate,
  onActionComplete,
}: EmployeeActionsProps) {
  const { id, fullName, status } = employee;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const canUpdate = hasPermission("employees", "update");
  const canTerminate = hasPermission("employees", "delete");
  const isAlreadyTerminated = status === "terminated";

  // ── Terminate dialog state ──────────────────────────────────────────────
  const [terminateDialog, setTerminateDialog] = useState(false);
  const [terminationDate, setTerminationDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [terminationReason, setTerminationReason] = useState("");

  const terminateMutation = useTerminateEmployee();

  const handleTerminateConfirm = async () => {
    const dto: TerminateEmployeeDTO = {
      termination_date: terminationDate,
      termination_reason: terminationReason || undefined,
    };
    try {
      await terminateMutation.mutateAsync({ id, data: dto });
      toast({ title: "Empleado dado de baja correctamente", variant: "success" });
      setTerminateDialog(false);
      setTerminationReason("");
      onActionComplete?.();
      onTerminate?.(id);
    } catch (error: any) {
      toast({
        title: "Error al dar de baja",
        description: error?.message,
        variant: "destructive",
      });
    }
  };

  // ── DROPDOWN MODE ───────────────────────────────────────────────────────

  if (variant === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menú de acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onView && (
              <DropdownMenuItem onClick={() => onView(id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
            )}

            {canUpdate && onEdit && (
              <DropdownMenuItem onClick={() => onEdit(id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}

            {canTerminate && !isAlreadyTerminated && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => setTerminateDialog(true)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Dar de baja
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <TerminateDialog
          open={terminateDialog}
          name={fullName}
          date={terminationDate}
          reason={terminationReason}
          isPending={terminateMutation.isPending}
          onDateChange={setTerminationDate}
          onReasonChange={setTerminationReason}
          onConfirm={handleTerminateConfirm}
          onCancel={() => setTerminateDialog(false)}
        />
      </>
    );
  }

  // ── BUTTONS MODE ────────────────────────────────────────────────────────

  const hasNoActions = !canUpdate && !canTerminate;
  if (hasNoActions) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canUpdate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/employees/${id}/edit`)}
            disabled={terminateMutation.isPending}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}

        {canTerminate && !isAlreadyTerminated && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setTerminateDialog(true)}
            disabled={terminateMutation.isPending}
          >
            {terminateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserX className="mr-2 h-4 w-4" />
            )}
            Dar de baja
          </Button>
        )}
      </div>

      <TerminateDialog
        open={terminateDialog}
        name={fullName}
        date={terminationDate}
        reason={terminationReason}
        isPending={terminateMutation.isPending}
        onDateChange={setTerminationDate}
        onReasonChange={setTerminationReason}
        onConfirm={handleTerminateConfirm}
        onCancel={() => setTerminateDialog(false)}
      />
    </>
  );
}

// ============================================================================
// TERMINATE DIALOG
// ============================================================================

interface TerminateDialogProps {
  open: boolean;
  name: string;
  date: string;
  reason: string;
  isPending: boolean;
  onDateChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function TerminateDialog({
  open,
  name,
  date,
  reason,
  isPending,
  onDateChange,
  onReasonChange,
  onConfirm,
  onCancel,
}: TerminateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Dar de baja a este empleado?</AlertDialogTitle>
          <AlertDialogDescription>
            El empleado <strong>{name}</strong> será marcado como dado de baja.
            Esta acción puede revertirse editando su estado.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="termination-date">Fecha de baja *</Label>
            <Input
              id="termination-date"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="termination-reason">Motivo (opcional)</Label>
            <Textarea
              id="termination-reason"
              placeholder="Renuncia voluntaria, fin de contrato..."
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isPending || !date}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Dar de baja
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
