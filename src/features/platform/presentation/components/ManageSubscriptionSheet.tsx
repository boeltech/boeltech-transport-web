import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FieldInlineError,
  FormValidationSummary,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { PlatformTenantListItem } from "../../domain/entities";
import {
  usePlatformTenantSubscription,
  useUpsertPlatformTenantSubscription,
} from "../../application/hooks/usePlatformBilling";
import { usePlatformPlans } from "../../application/hooks/usePlatformTenants";
import {
  managePlatformSubscriptionSchema,
  type ManagePlatformSubscriptionFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";
import {
  formatPlanSelectLabel,
  resolvePlanDisplayName,
} from "../utils/formatPlanLabel";
import {
  isDeclaredFleetBand,
  recommendOperationalPlanCode,
} from "../utils/recommendOperationalPlan";

interface ManageSubscriptionSheetProps {
  tenant: PlatformTenantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBSCRIPTION_STATUS_OPTIONS = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
] as const;

const BILLING_CYCLE_OPTIONS = ["monthly", "annual"] as const;

export function ManageSubscriptionSheet({
  tenant,
  open,
  onOpenChange,
}: ManageSubscriptionSheetProps) {
  const { toast } = useToast();
  const { data: plans } = usePlatformPlans();
  const { data: subscription } = usePlatformTenantSubscription(tenant?.id ?? "");
  const upsertMutation = useUpsertPlatformTenantSubscription({
    onSuccess: () => {
      toast({
        title: platformCopy.tenants.manageSubscription.success,
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: platformCopy.tenants.manageSubscription.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ManagePlatformSubscriptionFormData>({
    resolver: zodResolver(managePlatformSubscriptionSchema),
    defaultValues: {
      planCode: tenant?.planCode ?? "",
      status: "active",
      billingCycle: "monthly",
      trialEndsAt: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!tenant) return;
    form.reset({
      planCode: subscription?.planCode ?? tenant.planCode ?? "",
      status:
        (subscription?.status as ManagePlatformSubscriptionFormData["status"]) ??
        "active",
      billingCycle:
        (subscription?.billingCycle as ManagePlatformSubscriptionFormData["billingCycle"]) ??
        "monthly",
      trialEndsAt: subscription?.trialEndsAt
        ? subscription.trialEndsAt.slice(0, 16)
        : "",
      notes: subscription?.notes ?? "",
    });
  }, [tenant, subscription, form]);

  const status = useWatch({ control: form.control, name: "status" });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tenant) return;
    await upsertMutation.mutateAsync({
      tenantId: tenant.id,
      payload: {
        planCode: values.planCode,
        status: values.status,
        billingCycle: values.billingCycle,
        trialEndsAt: values.trialEndsAt
          ? new Date(values.trialEndsAt).toISOString()
          : null,
        notes: values.notes?.trim() || null,
      },
    });
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const copy = platformCopy.tenants.manageSubscription;
  const createCopy = platformCopy.tenants.create;

  const fleetBand =
    tenant?.declaredFleetBand && isDeclaredFleetBand(tenant.declaredFleetBand)
      ? tenant.declaredFleetBand
      : null;
  const suggestedPlanCode = recommendOperationalPlanCode({ band: fleetBand });
  const suggestedPlanName = resolvePlanDisplayName(suggestedPlanCode, plans);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {fleetBand ? (
            <AlertWithIcon variant="info" title="Tip por flota">
              {copy.fleetHint(createCopy.fleetBands[fleetBand], suggestedPlanName)}
            </AlertWithIcon>
          ) : null}

          {status === "trialing" ? (
            <AlertWithIcon variant="info" title="Cupo de prueba">
              {copy.trialHint}
            </AlertWithIcon>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="sub-planCode">{copy.fields.plan}</Label>
            <Select
              value={form.watch("planCode")}
              onValueChange={(value) =>
                form.setValue("planCode", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                id="sub-planCode"
                {...getRegisterFieldErrorProps(
                  "planCode",
                  form.formState.errors.planCode?.message,
                )}
              >
                <SelectValue placeholder={copy.placeholders.plan} />
              </SelectTrigger>
              <SelectContent>
                {(plans ?? []).map((plan) => (
                  <SelectItem key={plan.code} value={plan.code}>
                    {formatPlanSelectLabel(plan)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldInlineError
              fieldId="sub-planCode"
              message={form.formState.errors.planCode?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sub-status">{copy.fields.status}</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => {
                  const next =
                    value as ManagePlatformSubscriptionFormData["status"];
                  form.setValue("status", next, { shouldValidate: true });
                  if (
                    next === "trialing" &&
                    !form.getValues("trialEndsAt")
                  ) {
                    const end = new Date();
                    end.setDate(end.getDate() + 14);
                    const local = new Date(
                      end.getTime() - end.getTimezoneOffset() * 60_000,
                    )
                      .toISOString()
                      .slice(0, 16);
                    form.setValue("trialEndsAt", local, {
                      shouldValidate: false,
                    });
                  }
                }}
              >
                <SelectTrigger id="sub-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {platformCopy.tenants.detail.subscription.statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-cycle">{copy.fields.cycle}</Label>
              <Select
                value={form.watch("billingCycle")}
                onValueChange={(value) =>
                  form.setValue(
                    "billingCycle",
                    value as ManagePlatformSubscriptionFormData["billingCycle"],
                    { shouldValidate: true },
                  )
                }
              >
                <SelectTrigger id="sub-cycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLE_OPTIONS.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {platformCopy.tenants.detail.subscription.cycleLabels[cycle]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-trial">{copy.fields.trial}</Label>
            <Input
              id="sub-trial"
              type="datetime-local"
              {...form.register("trialEndsAt")}
            />
            <FieldInlineError
              fieldId="sub-trial"
              message={form.formState.errors.trialEndsAt?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-notes">{copy.fields.notes}</Label>
            <Textarea
              id="sub-notes"
              rows={3}
              placeholder={copy.placeholders.notes}
              {...form.register("notes")}
            />
            <FieldInlineError
              fieldId="sub-notes"
              message={form.formState.errors.notes?.message}
            />
          </div>

          <FormValidationSummary messages={summaryErrors} />

          <SheetFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? copy.submitting : copy.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
