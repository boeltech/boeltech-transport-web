import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  useGrantPlatformStampPack,
  usePlatformStampPackCatalog,
  usePlatformTenantStampPacks,
} from "../../application/hooks/usePlatformBilling";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPriceCents } from "../utils/platformBillingFormatters";

const grantSchema = z.object({
  catalogCode: z.string().min(1, "Selecciona un pack"),
  notes: z.string().max(2000).optional(),
});

type GrantFormData = z.infer<typeof grantSchema>;

interface GrantStampPackSheetProps {
  tenant: PlatformTenantListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrantStampPackSheet({
  tenant,
  open,
  onOpenChange,
}: GrantStampPackSheetProps) {
  const copy = platformCopy.tenants.stampPacks;
  const { toast } = useToast();
  const { data: catalog, isLoading: catalogLoading } =
    usePlatformStampPackCatalog();
  const { data: balance } = usePlatformTenantStampPacks(tenant?.id ?? "");

  const grantMutation = useGrantPlatformStampPack({
    onSuccess: () => {
      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<GrantFormData>({
    resolver: zodResolver(grantSchema),
    defaultValues: { catalogCode: "", notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ catalogCode: "", notes: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tenant) return;
    await grantMutation.mutateAsync({
      tenantId: tenant.id,
      payload: {
        catalogCode: values.catalogCode,
        notes: values.notes?.trim() || null,
      },
    });
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const selected = catalog?.find((p) => p.code === form.watch("catalogCode"));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <AlertWithIcon variant="info" title={copy.balanceTitle}>
            {copy.balanceSummary(balance?.prepaidRemaining ?? 0)}
          </AlertWithIcon>

          <div className="space-y-2">
            <Label htmlFor="pack-code">{copy.fields.pack}</Label>
            <Select
              value={form.watch("catalogCode")}
              onValueChange={(value) =>
                form.setValue("catalogCode", value, { shouldValidate: true })
              }
              disabled={catalogLoading}
            >
              <SelectTrigger
                id="pack-code"
                {...getRegisterFieldErrorProps(
                  "catalogCode",
                  form.formState.errors.catalogCode?.message,
                )}
              >
                <SelectValue placeholder={copy.placeholders.pack} />
              </SelectTrigger>
              <SelectContent>
                {(catalog ?? []).map((pack) => (
                  <SelectItem key={pack.code} value={pack.code}>
                    {pack.name} · {pack.stamps} timbres ·{" "}
                    {formatBillingPriceCents(pack.priceCents)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldInlineError
              fieldId="pack-code"
              message={form.formState.errors.catalogCode?.message}
            />
            {selected ? (
              <p className="text-xs text-muted-foreground">
                {copy.selectedHint(
                  selected.stamps,
                  formatBillingPriceCents(selected.priceCents),
                )}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pack-notes">{copy.fields.notes}</Label>
            <Textarea
              id="pack-notes"
              rows={3}
              placeholder={copy.placeholders.notes}
              {...form.register("notes")}
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
            <Button type="submit" disabled={grantMutation.isPending}>
              {grantMutation.isPending ? copy.submitting : copy.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
