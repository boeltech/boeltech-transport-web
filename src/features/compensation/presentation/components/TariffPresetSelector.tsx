import { useCallback, useState } from "react";
import { ArrowLeft, Container, Car, Truck, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { cn } from "@shared/lib/utils/cn";
import { useCreateCompensationTemplate } from "../../application/hooks";
import { compensationCopy } from "../copy/compensationCopy";
import {
  TARIFF_PRESETS,
  type TariffPreset,
} from "../config/tariffPresets";
import type { CreateCompensationTemplatePayload } from "../../domain/entities";

const copy = compensationCopy.presets;

const ICON_MAP = {
  truck: Truck,
  car: Car,
  container: Container,
  pencil: Pencil,
} as const;

interface TariffPresetSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (template: { id: string }) => void;
}

type Step = "select" | "name";

export function TariffPresetSelector({
  open,
  onOpenChange,
  onCreated,
}: TariffPresetSelectorProps) {
  const { toast } = useToast();
  const createMutation = useCreateCompensationTemplate();

  const [step, setStep] = useState<Step>("select");
  const [selectedPreset, setSelectedPreset] = useState<TariffPreset | null>(null);
  const [isBlank, setIsBlank] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const resetState = useCallback(() => {
    setStep("select");
    setSelectedPreset(null);
    setIsBlank(false);
    setName("");
    setDescription("");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState],
  );

  const handleSelectPreset = useCallback(
    (preset: TariffPreset) => {
      setSelectedPreset(preset);
      setIsBlank(false);
      setName(preset.suggestedName);
      setDescription("");
      setStep("name");
    },
    [],
  );

  const handleSelectBlank = useCallback(() => {
    setSelectedPreset(null);
    setIsBlank(true);
    setName("");
    setDescription("");
    setStep("name");
  }, []);

  const handleBack = useCallback(() => {
    setStep("select");
  }, []);

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const payload: CreateCompensationTemplatePayload = {
      name: trimmedName,
      description: description.trim() || undefined,
    };

    if (selectedPreset && !isBlank) {
      payload.rules = selectedPreset.rules;
      payload.fixedAllowances = selectedPreset.fixedAllowances;
      payload.deductions = selectedPreset.deductions ?? [];
    }

    try {
      const result = await createMutation.mutateAsync(payload);
      toast({
        title: compensationCopy.toasts.templateCreated,
        variant: "success",
      });
      handleOpenChange(false);
      onCreated(result);
    } catch (error) {
      toast({
        title: compensationCopy.toasts.templateCreateError,
        description: getErrorMessage(error),
        variant: "error",
      });
    }
  }, [
    name,
    description,
    selectedPreset,
    isBlank,
    createMutation,
    toast,
    handleOpenChange,
    onCreated,
  ]);

  const presetSummaryLines: string[] = selectedPreset
    ? [
        ...selectedPreset.rules.map((rule) => {
          const routeLabels: Record<string, string> = {
            ...compensationCopy.builder.routeTypeLabels,
          };
          const route = routeLabels[rule.routeType] ?? rule.routeType;
          switch (rule.commissionType) {
            case "rate_per_km":
              return `Pago por km ${route.toLowerCase()} ($${rule.rateValue}/km)`;
            case "percentage_of_freight":
              return `${rule.rateValue}% del flete (${route.toLowerCase()})`;
            case "fixed_per_trip":
              return `$${rule.rateValue} por viaje (${route.toLowerCase()})`;
            default:
              return `Sin pago por viaje (${route.toLowerCase()})`;
          }
        }),
        ...selectedPreset.fixedAllowances.map(
          (a) => `${a.label} $${a.amount} (${a.period === "weekly" ? "semanal" : a.period === "biweekly" ? "quincenal" : "mensual"})`,
        ),
        ...(selectedPreset.deductions ?? []).map(
          (d) => `− ${d.label} $${d.amount} (${d.period === "weekly" ? "semanal" : d.period === "biweekly" ? "quincenal" : "mensual"})`,
        ),
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="border-b px-6 py-4 text-left">
          <SheetTitle>{copy.title}</SheetTitle>
          {step === "select" ? (
            <SheetDescription>{copy.subtitleDescription}</SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "select" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {copy.subtitle}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TARIFF_PRESETS.map((preset) => {
                  const Icon = ICON_MAP[preset.iconName];
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={cn(
                        "group flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                        "hover:border-primary/50 hover:bg-primary/5",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {preset.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {preset.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={handleSelectBlank}
                  className={cn(
                    "group flex flex-col items-start gap-2 rounded-lg border border-dashed p-4 text-left transition-colors",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {copy.blankName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {copy.blankDescription}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {copy.step2Back}
              </Button>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="preset-name">{copy.nameLabel}</Label>
                  <Input
                    id="preset-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={copy.namePlaceholder}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="preset-description">
                    {copy.descriptionLabel}
                  </Label>
                  <Textarea
                    id="preset-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={copy.descriptionPlaceholder}
                    rows={2}
                  />
                </div>

                {presetSummaryLines.length > 0 ? (
                  <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground">
                      {copy.prefilledHint}
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {presetSummaryLines.map((line, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                          {line}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground italic">
                      {copy.customizeHint}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {step === "name" ? (
          <div className="border-t px-6 py-4">
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createMutation.isPending}
              >
                {copy.cancel}
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={!name.trim() || createMutation.isPending}
                isLoading={createMutation.isPending}
              >
                {createMutation.isPending ? copy.creating : copy.create}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
