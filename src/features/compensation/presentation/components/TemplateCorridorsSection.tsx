import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, type Control } from "react-hook-form";
import { Plus, Route } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { FormSectionCard } from "@shared/ui/form-section-card";
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
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { CorridorTariffSheet } from "./CorridorTariffSheet";

const copy = compensationCopy.sheet;
const detailCopy = compensationCopy.templateDetail;
const builderCopy = compensationCopy.builder;

interface TemplateCorridorsSectionProps {
  control: Control<CompensationTemplateFormData>;
  stepPrefix?: string;
  operationalLexicon?: boolean;
}

export function TemplateCorridorsSection({
  control,
  stepPrefix = "3.",
  operationalLexicon = true,
}: TemplateCorridorsSectionProps) {
  const { data: corridorsData } = useCorridorTariffs({ isActive: true, pageSize: 100 });
  const corridors = corridorsData?.data ?? [];
  const hasCorridors = corridors.length > 0;
  const [inlineSheetOpen, setInlineSheetOpen] = useState(false);
  const [corridorSearch, setCorridorSearch] = useState("");

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

  const sectionTitle = operationalLexicon
    ? builderCopy.corridorsSectionTitle
    : detailCopy.corridorsTitle;
  // En Builder la descripción vive en BuilderCorridorsSection; en Sheet va en la card.
  const sectionHelp = operationalLexicon ? undefined : copy.corridorsSectionHelp;
  const emptyLabel = operationalLexicon
    ? builderCopy.noCorridors
    : detailCopy.noCorridors;

  return (
    <FormSectionCard
      title={stepPrefix.trim() ? `${stepPrefix} ${sectionTitle}` : sectionTitle}
      icon={<Route className="h-4 w-4" />}
      description={sectionHelp}
      contentClassName="space-y-4"
    >
      <Controller
        control={control}
        name="corridorIds"
        render={({ field }) => (
          <div className="space-y-2">
            {hasCorridors ? (
              <Input
                value={corridorSearch}
                onChange={(event) => setCorridorSearch(event.target.value)}
                placeholder={copy.corridorSearchPlaceholder}
                aria-label={copy.corridorSearchPlaceholder}
              />
            ) : null}
            <div className="max-h-60 overflow-y-auto rounded-md border p-3 space-y-2">
              {!hasCorridors || filteredCorridors.length === 0 ? (
                <p className="text-xs text-muted-foreground">{emptyLabel}</p>
              ) : (
                filteredCorridors.map((corridor) => {
                  const checked = field.value.includes(corridor.id);
                  const routeLabel = formatCorridorRouteHuman(corridor, branchNameMap);
                  return (
                    <label
                      key={corridor.id}
                      className="flex items-start gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={checked}
                        onCheckedChange={(value) => {
                          if (value === true) {
                            field.onChange([...field.value, corridor.id]);
                          } else {
                            field.onChange(field.value.filter((id) => id !== corridor.id));
                          }
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-medium truncate">{routeLabel}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {formatMxCurrency(corridor.fixedAmount)}
                          </span>
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {corridor.name}
                        </span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-sm"
                onClick={() => setInlineSheetOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {copy.createCorridorLink}
              </Button>
              <Link
                to={COMPENSATION_CORRIDORS_PATH}
                className="inline-block text-sm text-primary hover:underline"
              >
                {copy.manageCorridorsLink}
              </Link>
            </div>
            <CorridorTariffSheet
              open={inlineSheetOpen}
              onOpenChange={setInlineSheetOpen}
              corridor={null}
              existingCorridors={corridors}
              canSave={true}
              onSuccess={(createdId) => {
                if (createdId && !field.value.includes(createdId)) {
                  field.onChange([...field.value, createdId]);
                }
              }}
            />
          </div>
        )}
      />
    </FormSectionCard>
  );
}
