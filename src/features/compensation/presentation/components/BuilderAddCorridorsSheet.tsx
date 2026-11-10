import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { BranchStatus, useBranches } from "@features/branches";
import { COMPENSATION_CORRIDORS_PATH } from "../../application/compensationRoutes";
import { useCorridorTariffs } from "../../application/hooks/useCorridors";
import { compensationCopy } from "../copy/compensationCopy";
import {
  buildBranchNameMap,
  formatCorridorRouteHuman,
} from "../utils/formatCorridorRoute";
import { CORRIDOR_REF_TYPE_LABELS } from "../../domain/enums";
import { CorridorTariffSheet } from "./CorridorTariffSheet";

const builderCopy = compensationCopy.builder;
const sheetCopy = compensationCopy.sheet;

interface BuilderAddCorridorsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: readonly string[];
  onChange: (ids: string[]) => void;
  readOnly?: boolean;
}

export function BuilderAddCorridorsSheet({
  open,
  onOpenChange,
  selectedIds,
  onChange,
  readOnly = false,
}: BuilderAddCorridorsSheetProps) {
  const [corridorSearch, setCorridorSearch] = useState("");
  const [inlineCreateOpen, setInlineCreateOpen] = useState(false);
  const { data: corridorsData } = useCorridorTariffs({
    isActive: true,
    pageSize: 100,
  });
  const corridors = corridorsData?.data ?? [];

  const { data: branchesData } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  const branchNameMap = useMemo(
    () => buildBranchNameMap(branchesData?.data ?? []),
    [branchesData?.data],
  );

  const filteredCorridors = useMemo(() => {
    const query = corridorSearch.trim().toLowerCase();
    if (!query) return corridors;
    return corridors.filter((corridor) => {
      const routeLabel = formatCorridorRouteHuman(corridor, branchNameMap);
      return (
        corridor.name.toLowerCase().includes(query) ||
        routeLabel.toLowerCase().includes(query)
      );
    });
  }, [branchNameMap, corridorSearch, corridors]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b px-6 py-4 text-left">
            <SheetTitle>{builderCopy.tripStep1SheetTitle}</SheetTitle>
            <SheetDescription>
              {builderCopy.tripStep1SheetDescription}
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
            {corridors.length > 0 ? (
              <Input
                value={corridorSearch}
                onChange={(event) => setCorridorSearch(event.target.value)}
                placeholder={sheetCopy.corridorSearchPlaceholder}
                aria-label={sheetCopy.corridorSearchPlaceholder}
              />
            ) : null}

            <div className="space-y-2 rounded-md border p-3">
              {filteredCorridors.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {builderCopy.noCorridors}
                </p>
              ) : (
                filteredCorridors.map((corridor) => {
                  const checked = selectedIds.includes(corridor.id);
                  const routeLabel = formatCorridorRouteHuman(
                    corridor,
                    branchNameMap,
                  );
                  const matchBy =
                    CORRIDOR_REF_TYPE_LABELS[corridor.originRefType];
                  return (
                    <label
                      key={corridor.id}
                      className="flex cursor-pointer items-start gap-2 text-sm"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        disabled={readOnly}
                        onCheckedChange={(value) => {
                          if (readOnly) return;
                          if (value === true) {
                            onChange([...selectedIds, corridor.id]);
                          } else {
                            onChange(
                              selectedIds.filter((id) => id !== corridor.id),
                            );
                          }
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">
                            {routeLabel}
                          </span>
                          <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                            {formatMxCurrency(corridor.fixedAmount)}
                          </span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {matchBy} · {corridor.name}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>

            {!readOnly ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-sm"
                  onClick={() => setInlineCreateOpen(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {sheetCopy.createCorridorLink}
                </Button>
                <Link
                  to={COMPENSATION_CORRIDORS_PATH}
                  className="inline-block text-sm text-primary hover:underline"
                >
                  {sheetCopy.manageCorridorsLink}
                </Link>
              </div>
            ) : null}
          </div>

          <SheetFooter className="border-t px-6 py-4">
            <Button type="button" onClick={() => onOpenChange(false)}>
              {builderCopy.tripStep1SheetDone}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <CorridorTariffSheet
        open={inlineCreateOpen}
        onOpenChange={setInlineCreateOpen}
        corridor={null}
        existingCorridors={corridors}
        canSave={!readOnly}
        onSuccess={(createdId) => {
          if (createdId && !selectedIds.includes(createdId)) {
            onChange([...selectedIds, createdId]);
          }
        }}
      />
    </>
  );
}
