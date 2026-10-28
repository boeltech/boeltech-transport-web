import { useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { getRegisterFieldErrorProps } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { generateSecurePassword } from "@shared/utils/generateSecurePassword";
import { mapBackendError } from "@shared/utils/errorMapper";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { useRotatePlatformAdminCredentials } from "../../application/hooks/usePlatformTenants";
import {
  rotateAdminCredentialsSchema,
  type RotateAdminCredentialsFormData,
} from "../validation";
import { platformCopy } from "../copy/platformCopy";
import {
  OpsAlert,
  OpsButton,
  OpsCheckbox,
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsDialogTitle,
  OpsFieldError,
  OpsFormErrors,
  OpsInput,
  OpsLabel,
} from "./ui";

interface OpsRotateAdminCredentialsDialogProps {
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Rotar credenciales admin — piel Ops (craft A).
 * Flujo idéntico a RotateAdminCredentialsDialog ERP (flag-off / legacy).
 */
export function OpsRotateAdminCredentialsDialog({
  tenantId,
  open,
  onOpenChange,
}: OpsRotateAdminCredentialsDialogProps) {
  return (
    <OpsDialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <OpsRotateAdminCredentialsDialogContent
          tenantId={tenantId}
          onOpenChange={onOpenChange}
        />
      ) : null}
    </OpsDialog>
  );
}

function OpsRotateAdminCredentialsDialogContent({
  tenantId,
  onOpenChange,
}: Omit<OpsRotateAdminCredentialsDialogProps, "open">) {
  const { toast } = useToast();
  const copy = platformCopy.tenants.detail.adminActivation.rotateDialog;
  const createCopy = platformCopy.tenants.create;
  const [showPassword, setShowPassword] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
  const summaryErrors = collectFieldErrorMessages(errors);

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
    <OpsDialogContent
      tone="default"
      className="sm:max-w-md"
      data-testid="ops-rotate-admin-credentials-dialog"
    >
      <OpsDialogHeader>
        <OpsDialogTitle>{copy.title}</OpsDialogTitle>
        <OpsDialogDescription>{copy.description}</OpsDialogDescription>
      </OpsDialogHeader>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {inlineError ? (
          <OpsAlert tone="danger" title={copy.error}>
            {inlineError}
          </OpsAlert>
        ) : null}

        <OpsFormErrors messages={summaryErrors} />

        <div className="space-y-1.5">
          <OpsLabel htmlFor="ops-rotate-admin-password">
            {copy.passwordLabel}
          </OpsLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <OpsInput
              id="ops-rotate-admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="min-w-0 flex-1"
              {...register("password")}
              {...getRegisterFieldErrorProps(
                "ops-rotate-admin-password",
                errors.password?.message,
              )}
            />
            <div className="flex flex-wrap gap-1">
              <OpsButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword
                  ? createCopy.passwordActions.hide
                  : createCopy.passwordActions.show}
              </OpsButton>
              <OpsButton
                type="button"
                variant="ghost"
                size="sm"
                aria-label={createCopy.passwordActions.copy}
                disabled={!passwordValue.trim()}
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
                <Copy className="h-3.5 w-3.5" />
              </OpsButton>
              <OpsButton
                type="button"
                variant="ghost"
                size="sm"
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
              </OpsButton>
            </div>
          </div>
          <OpsFieldError
            fieldId="ops-rotate-admin-password"
            message={errors.password?.message}
          />
        </div>

        <OpsCheckbox
          id="ops-rotate-resend-activation"
          checked={Boolean(resendActivation)}
          onChange={(event) =>
            setValue("resendActivation", event.target.checked, {
              shouldDirty: true,
            })
          }
          label={copy.resendLabel}
        />

        <OpsDialogFooter>
          <OpsButton
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={rotateMutation.isPending}
          >
            {copy.cancel}
          </OpsButton>
          <OpsButton type="submit" loading={rotateMutation.isPending}>
            {rotateMutation.isPending ? copy.submitting : copy.submit}
          </OpsButton>
        </OpsDialogFooter>
      </form>
    </OpsDialogContent>
  );
}
