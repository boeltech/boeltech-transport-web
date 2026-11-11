import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application/compensationRoutes";
import { useCompensationTemplates } from "@features/compensation/application/hooks";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.operatorsList.panel;

interface OperatorAssignTariffPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (templateId: string) => void;
}

/**
 * Paso previo a `TemplateAssignmentBatchSheet`: el sheet exige `templateId`.
 * Lista tarifas del scope «Vigentes» y delega el lote al sheet reutilizado.
 */
export function OperatorAssignTariffPicker({
  open,
  onOpenChange,
  onPick,
}: OperatorAssignTariffPickerProps) {
  const { data, isLoading, isError } = useCompensationTemplates(
    { groupBy: "family", scope: "current", page: 1, pageSize: 50 },
    { enabled: open },
  );
  /** D: solo activas; `scope=current` del catálogo Tarifas sigue listando drafts. */
  const templates = (data?.data ?? []).filter((tpl) => tpl.status === "active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="operators-assign-picker">
        <DialogHeader>
          <DialogTitle>{copy.pickTemplateTitle}</DialogTitle>
          <DialogDescription>{copy.pickTemplateDescription}</DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-1 overflow-y-auto py-1">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <p className="text-sm text-muted-foreground">{copy.pickTemplateEmpty}</p>
          ) : templates.length === 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{copy.pickTemplateEmpty}</p>
              <Button asChild variant="outline" size="sm">
                <Link to={COMPENSATION_TEMPLATES_PATH}>{copy.goToTariffs}</Link>
              </Button>
            </div>
          ) : (
            templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                data-testid={`operators-pick-template-${tpl.id}`}
                className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onPick(tpl.id);
                  onOpenChange(false);
                }}
              >
                <span className="font-medium">{tpl.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  v{tpl.version}
                </span>
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {copy.pickTemplateCancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
