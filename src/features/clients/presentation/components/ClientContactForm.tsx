/**
 * ClientContactForm — CRUD inline de contactos (WS-B)
 */

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  useForm,
  Controller,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FieldInlineError,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import { Checkbox } from "@shared/ui/checkbox";
import { cn } from "@shared/lib/utils/cn";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";

import { CLIENT_CONTACT_ROLE_LABELS } from "../../domain";
import {
  clientContactFormSchema,
  defaultClientContactFormValues,
  type ClientContactFormData,
} from "../validation/clientContactSchema";

export interface ClientContactFormRef {
  triggerValidation: () => Promise<boolean>;
}

export interface ClientContactFormProps {
  defaultValues?: Partial<ClientContactFormData>;
  onChange?: (data: ClientContactFormData, isValid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const NOTIFY_KEYS: (keyof ClientContactFormData)[] = [
  "fullName",
  "position",
  "email",
  "phone",
  "secondaryPhone",
  "signsCartaPorte",
  "receivesInvoices",
  "authorizesPayments",
  "isPrimary",
  "notes",
];

function ClientContactFormInner(
  {
    defaultValues,
    onChange,
    disabled = false,
    className,
  }: ClientContactFormProps,
  ref: React.ForwardedRef<ClientContactFormRef>,
) {
  const mergedDefaults = useMemo(
    () => ({ ...defaultClientContactFormValues, ...defaultValues }),
    [defaultValues],
  );

  const {
    register,
    control,
    trigger,
    formState: { errors, isValid },
  } = useForm<ClientContactFormData>({
    resolver: zodResolver(clientContactFormSchema) as Resolver<ClientContactFormData>,
    defaultValues: mergedDefaults,
    mode: "onChange",
  });

  const watched = useWatch({ control });
  const lastNotifyRef = useRef<string>("");

  useImperativeHandle(ref, () => ({
    triggerValidation: async () => trigger(),
  }));

  useEffect(() => {
    if (!onChange) return;
    const snapshot = NOTIFY_KEYS.map((key) => watched[key]).join("|");
    if (snapshot === lastNotifyRef.current) return;
    lastNotifyRef.current = snapshot;
    onChange(watched as ClientContactFormData, isValid);
  }, [watched, isValid, onChange]);

  const summaryMessages = useMemo(
    () => collectFieldErrorMessages(errors),
    [errors],
  );

  const renderRoleCheckbox = useCallback(
    (
      name: "signsCartaPorte" | "receivesInvoices" | "authorizesPayments",
      label: string,
    ) => (
      <Controller
        key={name}
        name={name}
        control={control}
        render={({ field }) => (
          <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <Checkbox
              id={name}
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              disabled={disabled}
            />
            <span className="text-sm leading-snug">{label}</span>
          </label>
        )}
      />
    ),
    [control, disabled],
  );

  return (
    <div className={cn("space-y-4", className)}>
      {summaryMessages.length > 0 ? (
        <FormValidationSummary messages={summaryMessages} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">
            Nombre completo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="fullName"
            disabled={disabled}
            error={Boolean(errors.fullName)}
            {...register("fullName")}
            {...getFieldErrorAriaProps("fullName", errors.fullName?.message)}
          />
          <FieldInlineError fieldId="fullName" message={errors.fullName?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Puesto</Label>
          <Input id="position" disabled={disabled} {...register("position")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" disabled={disabled} {...register("phone")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryPhone">Teléfono secundario</Label>
          <Input
            id="secondaryPhone"
            disabled={disabled}
            {...register("secondaryPhone")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            disabled={disabled}
            error={Boolean(errors.email)}
            {...register("email")}
            {...getFieldErrorAriaProps("email", errors.email?.message)}
          />
          <FieldInlineError fieldId="email" message={errors.email?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Roles operativos</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {renderRoleCheckbox(
            "signsCartaPorte",
            CLIENT_CONTACT_ROLE_LABELS.signsCartaPorte,
          )}
          {renderRoleCheckbox(
            "receivesInvoices",
            CLIENT_CONTACT_ROLE_LABELS.receivesInvoices,
          )}
          {renderRoleCheckbox(
            "authorizesPayments",
            CLIENT_CONTACT_ROLE_LABELS.authorizesPayments,
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={3} disabled={disabled} {...register("notes")} />
      </div>

      <Controller
        name="isPrimary"
        control={control}
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <Checkbox
              id="isPrimary"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              disabled={disabled}
            />
            <span className="text-sm">Marcar como contacto principal</span>
          </label>
        )}
      />
    </div>
  );
}

export const ClientContactForm = memo(forwardRef(ClientContactFormInner));

export default ClientContactForm;
