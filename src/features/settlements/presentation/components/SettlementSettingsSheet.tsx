import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Info, ShieldCheck } from "lucide-react";
import { approvalPoliciesPath } from "@features/approval-policies/application/approvalPoliciesRoutes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  FieldInlineError,
  MoneyInput,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";import { DEFAULT_VOBO_THRESHOLD_MXN } from "../../domain/enums";
import {
  useSettlementSettings,
  useUpdateSettlementSettings,
} from "../../application/hooks";
import {
  settlementSettingsFormSchema,
  type SettlementSettingsFormData,
} from "../validation/settlementSchemas";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.hub.settings;

interface SettlementSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettlementSettingsSheet({
  open,
  onOpenChange,
}: SettlementSettingsSheetProps) {
  const { toast } = useToast();
  const { data: settings } = useSettlementSettings({ enabled: open });
  const updateMutation = useUpdateSettlementSettings();

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettlementSettingsFormData>({
    resolver: zodResolver(settlementSettingsFormSchema) as never,
    defaultValues: {
      voboThresholdMxn: DEFAULT_VOBO_THRESHOLD_MXN,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      voboThresholdMxn: settings?.voboThresholdMxn ?? DEFAULT_VOBO_THRESHOLD_MXN,
    });
  }, [open, reset, settings]);

  const threshold = watch("voboThresholdMxn");
  const managedByPolicy = settings?.managedByPolicy === true;
  const apiError = updateMutation.error
    ? getErrorMessage(updateMutation.error)
    : null;
  const pending = isSubmitting || updateMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        voboThresholdMxn: values.voboThresholdMxn,
      });
      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    } catch {
      // Alert inline; toast is optional short copy.
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="sm:max-w-md"
          onFocusOutside={(e) => e.preventDefault()}
        >
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        {managedByPolicy ? (
          <div className="mt-6 space-y-5" data-testid="settlement-settings-managed">
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertTitle>{copy.managedTitle}</AlertTitle>
              <AlertDescription>{copy.managedDescription}</AlertDescription>
            </Alert>
            <div className="space-y-1.5">
              <Label htmlFor="vobo-threshold">{copy.thresholdLabel}</Label>
              <MoneyInput
                id="vobo-threshold"
                name="voboThresholdMxn"
                value={settings?.voboThresholdMxn}
                currencyCode="MXN"
                decimals={2}
                disabled
                readOnly
              />
            </div>
            <SheetFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {copy.close}
              </Button>
              <Button asChild>
                <Link to={approvalPoliciesPath("settlement")} onClick={() => onOpenChange(false)}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {copy.managedLink}
                </Link>
              </Button>
            </SheetFooter>
          </div>
        ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          {apiError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="vobo-threshold">{copy.thresholdLabel}</Label>
            <MoneyInput
              id="vobo-threshold"
              name="voboThresholdMxn"
              value={typeof threshold === "number" ? threshold : undefined}
              onValueChange={(value) =>
                setValue("voboThresholdMxn", value ?? 0, { shouldValidate: true })
              }
              currencyCode="MXN"
              decimals={2}
              error={Boolean(errors.voboThresholdMxn)}
              {...getFieldErrorAriaProps(
                "vobo-threshold",
                errors.voboThresholdMxn?.message,
              )}
            />
            <FieldInlineError
              fieldId="vobo-threshold"
              message={errors.voboThresholdMxn?.message}
            />
            <p className="text-xs text-muted-foreground">{copy.thresholdHint}</p>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? copy.saving : copy.save}
            </Button>
          </SheetFooter>
        </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
