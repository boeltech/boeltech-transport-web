import { useEffect, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Eye, EyeOff } from "lucide-react";
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
import { Checkbox } from "@shared/ui/checkbox";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  FieldInlineError,
  getRegisterFieldErrorProps,
} from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { generateSecurePassword } from "@shared/utils/generateSecurePassword";
import { mapBackendError } from "@shared/utils/errorMapper";
import { useRotatePlatformAdminCredentials } from "../../application/hooks/usePlatformTenants";
import {
  rotateAdminCredentialsSchema,
  type RotateAdminCredentialsFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";

interface RotateAdminCredentialsDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RotateAdminCredentialsDialog({
  tenantId,
  open,
  onOpenChange,
}: RotateAdminCredentialsDialogProps) {
  const { toast } = useToast();
  const copy = platformCopy.tenants.detail.adminActivation.rotateDialog;
  const createCopy = platformCopy.tenants.create;
  const [showPassword, setShowPassword] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<
    RotateAdminCredentialsFormData,
    unknown,
    RotateAdminCredentialsFormData
  >({
    resolver: zodResolver(
      rotateAdminCredentialsSchema,
    ) as Resolver<RotateAdminCredentialsFormData>,
    defaultValues: {
      password: "",
      resendActivation: true,
    },
  });

  const passwordValue = useWatch({ control, name: "password" }) ?? "";
  const resendActivation = useWatch({ control, name: "resendActivation" });

  useEffect(() => {
    if (!open) return;
    reset({ password: "", resendActivation: true });
    setShowPassword(false);
    setInlineError(null);
  }, [open, reset]);

  const rotateMutation = useRotatePlatformAdminCredentials({
    onSuccess: (_result, variables) => {
      toast({
        title: variables.payload.resendActivation
          ? copy.successWithResend
          : copy.success,
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      setInlineError(mapBackendError(error).message);
    },
  });

  const onSubmit = (values: RotateAdminCredentialsFormData) => {
    setInlineError(null);
    rotateMutation.mutate({
      id: tenantId,
      payload: {
        password: values.password,
        resendActivation: values.resendActivation,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {inlineError ? (
            <Alert variant="destructive">
              <AlertDescription>{inlineError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="rotate-admin-password">{copy.passwordLabel}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="rotate-admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password")}
                  {...getRegisterFieldErrorProps(
                    "rotate-admin-password",
                    errors.password?.message,
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? createCopy.passwordActions.hide
                      : createCopy.passwordActions.show
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next = generateSecurePassword(16);
                  setValue("password", next, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setShowPassword(true);
                }}
              >
                {createCopy.passwordActions.generate}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!passwordValue.trim()}
                aria-label={createCopy.passwordActions.copy}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(passwordValue);
                    toast({
                      title: createCopy.passwordActions.copied,
                      variant: "success",
                    });
                  } catch {
                    toast({
                      title: createCopy.passwordActions.copyError,
                      variant: "error",
                    });
                  }
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <FieldInlineError
              fieldId="rotate-admin-password"
              message={errors.password?.message}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="rotate-resend-activation"
              checked={Boolean(resendActivation)}
              onCheckedChange={(checked) =>
                setValue("resendActivation", checked === true, {
                  shouldDirty: true,
                })
              }
            />
            <Label htmlFor="rotate-resend-activation" className="font-normal">
              {copy.resendLabel}
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rotateMutation.isPending}
            >
              {copy.cancel}
            </Button>
            <Button type="submit" disabled={rotateMutation.isPending}>
              {rotateMutation.isPending ? copy.submitting : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
