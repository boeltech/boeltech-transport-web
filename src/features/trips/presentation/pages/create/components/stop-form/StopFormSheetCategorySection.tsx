import type { ComponentType } from "react";
import { MapPin } from "lucide-react";

import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { cn } from "@shared/lib/utils/cn";

import { wizardCopy } from "../../../../copy";
import type { StopFormData } from "../stopDialogAddressMapper";
import type { TripStopFormValues } from "../validation";

const copy = wizardCopy.route.stopForm.category;

export interface StopOperationOption {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export interface StopFormSheetCategorySectionProps {
  displayStop: StopFormData;
  getAvailableOperations: () => StopOperationOption[];
  onOperationToggle: (operation: TripStopFormValues["stopType"][number]) => void;
}

/**
 * Solo para escalas: pregunta operativa «¿Qué se hace aquí?».
 * Origen/destino comunican contexto en el encabezado del sheet.
 */
export function StopFormSheetCategorySection({
  displayStop,
  getAvailableOperations,
  onOperationToggle,
}: StopFormSheetCategorySectionProps) {
  if (displayStop.stopCategory !== "waypoint") {
    return null;
  }

  return (
    <FormSectionCard
      title={copy.waypointQuestion}
      icon={<MapPin className="h-4 w-4" />}
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3" role="group" aria-label={copy.waypointQuestion}>
        {getAvailableOperations().map((option) => {
          const OpIcon = option.icon;
          const operation = option.value as TripStopFormValues["stopType"][number];
          const isChecked =
            displayStop.stopType?.includes(operation) ?? false;
          const fieldId = `operation-${option.value}`;

          return (
            <label
              key={option.value}
              htmlFor={fieldId}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                isChecked && "border-primary bg-primary/5",
              )}
            >
              <Checkbox
                id={fieldId}
                checked={isChecked}
                aria-label={option.label}
                onCheckedChange={() => onOperationToggle(operation)}
              />
              <span className="flex items-center gap-2 text-sm font-medium leading-none" aria-hidden>
                <OpIcon className={cn("h-4 w-4", option.color)} aria-hidden />
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      <Label className="sr-only">{copy.waypointQuestion}</Label>
    </FormSectionCard>
  );
}
