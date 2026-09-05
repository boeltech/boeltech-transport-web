import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Controller, type Control } from "react-hook-form";
import { Route } from "lucide-react";
import { Checkbox } from "@shared/ui/checkbox";
import { FormSectionCard } from "@shared/ui/form-section-card";
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
            <div className="max-h-60 overflow-y-auto rounded-md border p-3 space-y-2">
              {corridors.length === 0 ? (
                <p className="text-xs text-muted-foreground">{emptyLabel}</p>
              ) : (
                corridors.map((corridor) => {
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
                      <span>
                        {corridor.name} · {routeLabel} · {formatMxCurrency(corridor.fixedAmount)}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <Link
              to={COMPENSATION_CORRIDORS_PATH}
              className="inline-block text-sm text-primary hover:underline"
            >
              {copy.manageCorridorsLink}
            </Link>
          </div>
        )}
      />
    </FormSectionCard>
  );
}
