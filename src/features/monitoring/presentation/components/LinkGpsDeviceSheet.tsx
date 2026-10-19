import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  FieldInlineError,
  FormValidationSummary,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useLinkGpsDevice } from "../../application";
import { monitoringCopy } from "../copy/monitoringCopy";
import {
  linkGpsDeviceSchema,
  type LinkGpsDeviceFormValues,
} from "../validation";

export interface LinkGpsDeviceSheetProps {
  readonly vehicleId: string;
  readonly vehicleLabel: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function linkErrorMessage(error: unknown): string {
  const copy = monitoringCopy.linkSheet;
  if (!isApiError(error)) return copy.errorGeneric;
  switch (error.code) {
    case "GPS_DEVICE_ALREADY_LINKED":
      return copy.errorAlreadyLinked;
    case "GPS_IMEI_ALREADY_ASSIGNED":
      return copy.errorImeiAssigned;
    case "GPS_IMEI_NOT_IN_TRACCAR":
      return copy.errorNotInTraccar;
    case "GPS_TRACKING_DISABLED":
      return copy.errorDisabled;
    default:
      return error.message || copy.errorGeneric;
  }
}

export function LinkGpsDeviceSheet({
  vehicleId,
  vehicleLabel,
  open,
  onOpenChange,
}: LinkGpsDeviceSheetProps) {
  const copy = monitoringCopy.linkSheet;
  const { toast } = useToast();

  const form = useForm<LinkGpsDeviceFormValues>({
    resolver: zodResolver(linkGpsDeviceSchema),
    defaultValues: { imei: "" },
  });

  const linkMutation = useLinkGpsDevice(vehicleId, {
    onSuccess: () => {
      toast({ title: copy.success, variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.errorGeneric,
        description: linkErrorMessage(error),
        variant: "error",
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ imei: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await linkMutation.mutateAsync({ imei: values.imei });
  });

  const summaryErrors = collectFieldErrorMessages(form.formState.errors);
  const imeiError = form.formState.errors.imei?.message;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-md overflow-y-auto"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description(vehicleLabel)}</SheetDescription>
        </SheetHeader>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            void onSubmit(e);
          }}
          noValidate
        >
          <FormValidationSummary messages={summaryErrors} />

          <div className="space-y-2">
            <Label htmlFor="gps-imei">
              {copy.imeiLabel} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="gps-imei"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
              placeholder="860012345678901"
              aria-invalid={Boolean(imeiError)}
              aria-describedby={
                imeiError ? "gps-imei-error" : "gps-imei-hint"
              }
              {...form.register("imei")}
            />
            <p id="gps-imei-hint" className="text-xs text-muted-foreground">
              {copy.imeiHint}
            </p>
            <FieldInlineError fieldId="gps-imei" message={imeiError} />
          </div>

          <SheetFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={linkMutation.isPending}
            >
              {copy.cancel}
            </Button>
            <Button type="submit" disabled={linkMutation.isPending}>
              {linkMutation.isPending ? copy.submitting : copy.submit}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
