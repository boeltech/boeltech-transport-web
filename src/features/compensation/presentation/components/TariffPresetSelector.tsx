import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Pencil,
  Percent,
  Plus,
  Truck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { cn } from "@shared/lib/utils/cn";
import { useCreateCompensationTemplate } from "../../application/hooks";
import { TEMPLATE_PAYMENT_PERIOD_LABELS } from "../../domain/enums";
import type { TemplatePaymentPeriod } from "../../domain/enums";
import type { CreateCompensationTemplatePayload } from "../../domain/entities";
import { compensationCopy } from "../copy/compensationCopy";
import { TARIFF_PRESETS, type TariffPreset } from "../config/tariffPresets";

const copy = compensationCopy.presets;

const ICON_MAP = {
  truck: Truck,
  percent: Percent,
  "map-pin": MapPin,
  calendar: Calendar,
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
  const [paymentPeriod, setPaymentPeriod] =
    useState<TemplatePaymentPeriod>("weekly");

  const resetState = useCallback(() => {
    setStep("select");
    setSelectedPreset(null);
    setIsBlank(false);
    setName("");
    setPaymentPeriod("weekly");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState],
  );

  const handleSelectPreset = useCallback((preset: TariffPreset) => {
    setSelectedPreset(preset);
    setIsBlank(false);
    setName(preset.suggestedName);
    setPaymentPeriod(preset.defaultPaymentPeriod ?? "weekly");
    setStep("name");
  }, []);

  const handleSelectBlank = useCallback(() => {
    setSelectedPreset(null);
    setIsBlank(true);
    setName("");
    setPaymentPeriod("weekly");
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
      paymentPeriod,
      salaryOnly: Boolean(selectedPreset?.salaryOnly),
    };

    if (selectedPreset && !isBlank) {
      payload.rules = selectedPreset.rules;
      payload.fixedAllowances = selectedPreset.fixedAllowances.map((item) => ({
        ...item,
        period: paymentPeriod,
      }));
      payload.deductions = (selectedPreset.deductions ?? []).map((item) => ({
        ...item,
        period: paymentPeriod,
      }));
      payload.salaryOnly = Boolean(selectedPreset.salaryOnly);
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
    paymentPeriod,
    selectedPreset,
    isBlank,
    createMutation,
    toast,
    handleOpenChange,
    onCreated,
  ]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-xl overflow-y-auto sm:max-w-xl"
        data-testid="tariff-preset-dialog"
      >
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          {step === "select" ? (
            <DialogDescription>{copy.subtitleDescription}</DialogDescription>
          ) : null}
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">{copy.subtitle}</p>
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
                    data-testid={`tariff-preset-${preset.id}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground group-hover:bg-primary/15 group-hover:text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {preset.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-auto w-full rounded-md bg-background px-2 py-1.5 font-mono text-xs text-muted-foreground">
                      {preset.formulaMini}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSelectBlank}
              className={cn(
                "group flex w-full items-center gap-3 rounded-lg border border-dashed p-4 text-left transition-colors",
                "hover:border-primary/50 hover:bg-primary/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
              data-testid="tariff-preset-blank"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Plus className="h-4 w-4" />
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

            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <div className="space-y-1.5">
                <Label htmlFor="preset-name">{copy.nameLabel}</Label>
                <Input
                  id="preset-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.namePlaceholder}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">{copy.nameHint}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preset-period">{copy.paymentPeriodLabel}</Label>
                <Select
                  value={paymentPeriod}
                  onValueChange={(value) =>
                    setPaymentPeriod(value as TemplatePaymentPeriod)
                  }
                >
                  <SelectTrigger id="preset-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(TEMPLATE_PAYMENT_PERIOD_LABELS) as Array<
                        [TemplatePaymentPeriod, string]
                      >
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {copy.paymentPeriodHint}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "name" ? (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
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
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
