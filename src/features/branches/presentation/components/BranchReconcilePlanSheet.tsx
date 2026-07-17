import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import { mapBackendError } from "@shared/utils/errorMapper";
import { branchQueryKeys } from "../../domain";
import { branchesApi } from "../../infrastructure";
import { branchesCopy } from "../copy/branchesCopy";

interface BranchReconcilePlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const copy = branchesCopy.overQuota.sheet;

export function BranchReconcilePlanSheet({
  open,
  onOpenChange,
}: BranchReconcilePlanSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const [preferredMainId, setPreferredMainId] = useState<string | null>(null);

  const previewQuery = useQuery({
    queryKey: branchQueryKeys.reconcilePreview(),
    queryFn: () => branchesApi.getReconcilePreview(),
    enabled: open,
    staleTime: 0,
  });

  const preview = previewQuery.data?.data;
  const maxBranches = preview?.capacity.maxBranches ?? null;

  // Semilla derivada del preview (preselección de sucursales elegibles y
  // destinos de reasignación por defecto). Se recalcula solo cuando cambia el
  // preview; el patrón de "adjusting state during render" evita el
  // anti-patrón setState-en-effect del design system.
  const previewSignature = useMemo(
    () =>
      preview
        ? preview.branches
            .map((branch) => `${branch.id}:${branch.preselected ? 1 : 0}`)
            .join("|")
        : "",
    [preview],
  );
  const [seededSignature, setSeededSignature] = useState<string | null>(null);

  if (open && preview && previewSignature !== seededSignature) {
    setSeededSignature(previewSignature);
    const keepId = preview.branches.find((branch) => branch.preselected)?.id;
    const defaults: Record<string, string> = {};
    for (const branch of preview.branches) {
      if (!branch.preselected && branch.employeeCount > 0 && keepId) {
        defaults[branch.id] = keepId;
      }
    }
    setSelectedIds(
      preview.branches
        .filter((branch) => branch.preselected)
        .map((branch) => branch.id),
    );
    setReassignments(defaults);
    setPreferredMainId(null);
  }

  const currentMain = useMemo(
    () => preview?.branches.find((branch) => branch.isMain) ?? null,
    [preview],
  );

  // Matriz resultante entre las conservadas: la matriz actual si sigue en la
  // selección; si no, la que el usuario prefiera; si no, la primera conservada.
  const resolvedMainId = useMemo(() => {
    if (!preview || maxBranches === null) return null;
    if (currentMain && selectedIds.includes(currentMain.id)) return currentMain.id;
    if (preferredMainId && selectedIds.includes(preferredMainId)) {
      return preferredMainId;
    }
    return selectedIds[0] ?? null;
  }, [preview, maxBranches, currentMain, selectedIds, preferredMainId]);

  const reconcileMutation = useMutation({
    mutationFn: () =>
      branchesApi.reconcilePlan({
        keepBranchIds: selectedIds,
        mainBranchId: resolvedMainId ?? undefined,
        employeeReassignments: Object.entries(reassignments).map(
          ([fromBranchId, toBranchId]) => ({
            fromBranchId,
            toBranchId,
          }),
        ),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: branchQueryKeys.reconcilePreview() });
      toast({
        title: branchesCopy.overQuota.reconcileSuccess,
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: branchesCopy.overQuota.reconcileError,
        description: mapBackendError(error).message,
        variant: "destructive",
      });
    },
  });

  const branchesToDeactivate = useMemo(() => {
    if (!preview) return [];
    const selected = new Set(selectedIds);
    return preview.branches.filter((branch) => !selected.has(branch.id));
  }, [preview, selectedIds]);

  const keptBranches = useMemo(() => {
    if (!preview) return [];
    const selected = new Set(selectedIds);
    return preview.branches.filter((branch) => selected.has(branch.id));
  }, [preview, selectedIds]);

  const toggleBranch = (branchId: string, checked: boolean) => {
    if (!preview || maxBranches === null) return;

    // Con plan de 1 sucursal, la selección es tipo radio: elegir una conserva
    // solo esa (y esa pasa a ser la matriz). No hay checkbox bloqueado.
    if (maxBranches === 1) {
      setSelectedIds([branchId]);
      return;
    }

    setSelectedIds((current) => {
      if (checked) {
        if (current.includes(branchId)) return current;
        if (current.length >= maxBranches) {
          return [...current.slice(1), branchId];
        }
        return [...current, branchId];
      }
      return current.filter((id) => id !== branchId);
    });
  };

  const canSubmit =
    preview &&
    maxBranches !== null &&
    selectedIds.length === maxBranches &&
    branchesToDeactivate.every((branch) => {
      if (branch.employeeCount === 0) return true;
      const target = reassignments[branch.id];
      return Boolean(target && selectedIds.includes(target));
    });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        {previewQuery.isLoading ? (
          <div className="flex-1 space-y-3 py-2" aria-busy="true">
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : null}

        {previewQuery.isError ? (
          <AlertWithIcon variant="destructive" className="my-2">
            {mapBackendError(previewQuery.error).message}
          </AlertWithIcon>
        ) : preview && preview.branches.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{copy.emptyBranches}</p>
        ) : null}

        {preview && maxBranches !== null && preview.branches.length > 0 ? (
          <div className="flex-1 space-y-6 py-2">
            <AlertWithIcon variant="warning" title={copy.intro.title}>
              {copy.intro.body(preview.capacity.activeCount, maxBranches)}
            </AlertWithIcon>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{copy.selectionTitle}</p>
                <Badge
                  variant={selectedIds.length === maxBranches ? "success" : "neutral"}
                  tone="soft"
                >
                  {copy.counter(selectedIds.length, maxBranches)}
                </Badge>
              </div>

              <div className="space-y-2">
                {preview.branches.map((branch) => {
                  const checked = selectedIds.includes(branch.id);
                  const isResolvedMain = resolvedMainId === branch.id;
                  const isNewMain = checked && isResolvedMain && !branch.isMain;
                  const canMakeMain =
                    checked &&
                    maxBranches > 1 &&
                    selectedIds.length > 1 &&
                    !isResolvedMain;

                  return (
                    <label
                      key={branch.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
                        checked
                          ? "border-primary/40 bg-primary-50"
                          : "border-border",
                      )}
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        aria-label={`Conservar ${branch.name}`}
                        onCheckedChange={(value) =>
                          toggleBranch(branch.id, value === true)
                        }
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {branch.code} — {branch.name}
                          </span>
                          {branch.isMain ? (
                            <Badge variant="info" tone="soft">
                              {copy.mainBadge}
                            </Badge>
                          ) : null}
                          {isNewMain ? (
                            <Badge variant="info" tone="soft">
                              {copy.newMainBadge}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="size-3.5" aria-hidden="true" />
                          {branch.employeeCount > 0
                            ? copy.employeeCount(branch.employeeCount)
                            : copy.noEmployees}
                        </p>
                        {canMakeMain ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto px-0 text-xs"
                            onClick={(event) => {
                              event.preventDefault();
                              setPreferredMainId(branch.id);
                            }}
                          >
                            {copy.makeMain}
                          </Button>
                        ) : null}
                      </div>
                      <Badge
                        variant={checked ? "success" : "destructive"}
                        tone="soft"
                      >
                        {checked ? copy.keepBadge : copy.deactivateBadge}
                      </Badge>
                    </label>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">{copy.mainHint}</p>
            </div>

            {branchesToDeactivate.some((branch) => branch.employeeCount > 0) ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{copy.employeesTitle}</p>
                  <p className="text-xs text-muted-foreground">{copy.employeesHint}</p>
                </div>
                {branchesToDeactivate
                  .filter((branch) => branch.employeeCount > 0)
                  .map((branch) => (
                    <div key={branch.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium">
                          {branch.code} — {branch.name}
                        </span>
                        <Badge variant="destructive" tone="soft">
                          {copy.deactivateBadge}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {copy.employeeCount(branch.employeeCount)}
                        </span>
                      </div>
                      <Label htmlFor={`reassign-${branch.id}`}>
                        {copy.destinationLabel}
                      </Label>
                      <Select
                        value={reassignments[branch.id] ?? ""}
                        onValueChange={(value) =>
                          setReassignments((current) => ({
                            ...current,
                            [branch.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger id={`reassign-${branch.id}`}>
                          <SelectValue placeholder={copy.destinationPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {keptBranches.map((kept) => (
                            <SelectItem key={kept.id} value={kept.id}>
                              {kept.code} — {kept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <SheetFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
          {preview && maxBranches !== null && !canSubmit ? (
            <p className="text-xs text-muted-foreground">
              {selectedIds.length !== maxBranches
                ? copy.disabledReason.selection(maxBranches)
                : copy.disabledReason.reassign}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!canSubmit || reconcileMutation.isPending}
              onClick={() => reconcileMutation.mutate()}
            >
              {reconcileMutation.isPending ? copy.submitting : copy.confirm}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
