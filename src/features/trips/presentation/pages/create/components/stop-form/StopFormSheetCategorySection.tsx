import type { ComponentType } from "react";
import { Flag, MapPin, Milestone, Navigation } from "lucide-react";

import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { cn } from "@shared/lib/utils/cn";

import type { StopFormData } from "../stopDialogAddressMapper";
import type { TripStopFormValues } from "../validation";

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

export function StopFormSheetCategorySection({
  displayStop,
  getAvailableOperations,
  onOperationToggle,
}: StopFormSheetCategorySectionProps) {
  return (
    <FormSectionCard
      title="Tipo de parada"
      icon={<Milestone className="h-4 w-4" />}
      contentClassName="space-y-4"
    >
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5",
          displayStop.stopCategory === "origin" && "bg-success-soft/60",
          displayStop.stopCategory === "waypoint" && "bg-muted/40",
          displayStop.stopCategory === "destination" && "bg-destructive-soft/60",
        )}
      >
        {displayStop.stopCategory === "origin" && (
          <>
            <Navigation className="h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="text-sm font-medium">Parada de origen</p>
              <p className="text-xs text-muted-foreground">Solo carga de mercancía</p>
            </div>
          </>
        )}
        {displayStop.stopCategory === "waypoint" && (
          <>
            <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Escala intermedia</p>
              <p className="text-xs text-muted-foreground">Carga, descarga o ambas</p>
            </div>
          </>
        )}
        {displayStop.stopCategory === "destination" && (
          <>
            <Flag className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium">Parada de destino</p>
              <p className="text-xs text-muted-foreground">Solo descarga de mercancía</p>
            </div>
          </>
        )}
      </div>

      {displayStop.stopCategory === "waypoint" ? (
        <div className="space-y-2">
          <Label className="text-sm">Operaciones en esta parada *</Label>
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
        </div>
      ) : null}
    </FormSectionCard>
  );
}
