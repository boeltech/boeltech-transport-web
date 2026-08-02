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
 * Origen/destino comunican contexto en el encabezado del sheet (D1).
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
      <div className="grid grid-cols-2 gap-3">
        {getAvailableOperations().map((option) => {
          const OpIcon = option.icon;
          const isChecked =
            displayStop.stopType?.includes(
              option.value as TripStopFormValues["stopType"][number],
            ) ?? false;

          return (
            <div
              key={option.value}
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                isChecked && "border-primary bg-primary/5",
              )}
              onClick={() =>
                onOperationToggle(
                  option.value as TripStopFormValues["stopType"][number],
                )
              }
            >
              <Checkbox
                id={`operation-${option.value}`}
                checked={isChecked}
                onCheckedChange={() => {}}
              />
              <label
                htmlFor={`operation-${option.value}`}
                className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
              >
                <OpIcon className={cn("h-4 w-4", option.color)} />
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
      <Label className="sr-only">{copy.waypointQuestion}</Label>
    </FormSectionCard>
  );
}
