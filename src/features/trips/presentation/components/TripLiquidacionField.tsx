/**
 * Campo Liquidación (ADR-0096) para canvas de reserva y detalle.
 * Hereda del perfil del cliente; override a Sin CFDI pide confirmación.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, type UseFormReturn } from "react-hook-form";
import { defaultCfdiEmissionIntentFromProfile } from "@boeltech/cfdi-domain/reglas/cfdi-emission-intent";

import {
  FormFieldShell,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@shared/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Button } from "@shared/ui/button";
import { AlertCircle } from "lucide-react";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";

import type { CfdiReceptorProfile } from "@features/clients";
import type { CfdiEmissionIntent } from "@features/trips/domain";
import type { TripWizardFormValues } from "../pages/create/components/validation";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";

const copy = cfdiEmissionIntentCopy;

const COMPLIANCE_SESSION_KEY = "adr0096.compliance.dismissed";

export function deriveLiquidacionFromProfile(
  profile: CfdiReceptorProfile | undefined | null,
): CfdiEmissionIntent {
  return defaultCfdiEmissionIntentFromProfile(
    profile === "comercial_only" ? "comercial_only" : "receptor_cfdi",
  );
}

interface TripLiquidacionFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  clientProfile: CfdiReceptorProfile | null | undefined;
  clientId: string | null | undefined;
}

export function TripLiquidacionField({
  form,
  clientProfile,
  clientId,
}: TripLiquidacionFieldProps) {
  const { control, setValue, watch } = form;
  const currentIntent = watch("cfdiEmissionIntent") as
    | CfdiEmissionIntent
    | undefined;
  const isComercialOnly = clientProfile === "comercial_only";

  const [pendingIntent, setPendingIntent] = useState<CfdiEmissionIntent | null>(
    null,
  );
  const [blockEmitirOpen, setBlockEmitirOpen] = useState(false);
  const [complianceVisible, setComplianceVisible] = useState(() => {
    try {
      return sessionStorage.getItem(COMPLIANCE_SESSION_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const derivedDefault = useMemo(
    () => deriveLiquidacionFromProfile(clientProfile),
    [clientProfile],
  );

  useEffect(() => {
    if (!clientId) return;
    setValue("cfdiEmissionIntent", derivedDefault, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [clientId, derivedDefault, setValue]);

  const applyIntent = useCallback(
    (intent: CfdiEmissionIntent) => {
      setValue("cfdiEmissionIntent", intent, {
        shouldDirty: true,
        shouldValidate: true,
      });
      if (intent === "sin_cfdi_efectivo" && complianceVisible) {
        try {
          sessionStorage.setItem(COMPLIANCE_SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        setComplianceVisible(false);
      }
    },
    [complianceVisible, setValue],
  );

  const handleIntentChange = useCallback(
    (next: string) => {
      if (next !== "emitir_cfdi" && next !== "sin_cfdi_efectivo") return;
      if (next === "emitir_cfdi" && isComercialOnly) {
        setBlockEmitirOpen(true);
        return;
      }
      const previous = currentIntent ?? derivedDefault;
      if (next === "sin_cfdi_efectivo" && previous === "emitir_cfdi") {
        setPendingIntent(next);
        return;
      }
      applyIntent(next);
    },
    [applyIntent, currentIntent, derivedDefault, isComercialOnly],
  );

  if (!clientId) return null;

  return (
    <div className="space-y-3">
      <Controller
        control={control}
        name="cfdiEmissionIntent"
        render={({ field, fieldState }) => (
          <FormFieldShell
            fieldId="cfdiEmissionIntent"
            label={
              <SectionHeadingWithHint
                noTitleWrap
                title={copy.field.label}
                hintLabel={copy.field.label}
                hint={<>{copy.field.hint}</>}
              />
            }
            errorMessage={fieldState.error?.message}
          >
            <Select
              value={field.value ?? derivedDefault}
              onValueChange={handleIntentChange}
            >
              <SelectTrigger
                id="cfdiEmissionIntent"
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(
                  "cfdiEmissionIntent",
                  fieldState.error?.message,
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emitir_cfdi">
                  {copy.options.emitir_cfdi}
                </SelectItem>
                <SelectItem value="sin_cfdi_efectivo">
                  {copy.options.sin_cfdi_efectivo}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormFieldShell>
        )}
      />

      {(currentIntent ?? derivedDefault) === "sin_cfdi_efectivo" &&
      complianceVisible ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{copy.chip.sinCfdi}</AlertTitle>
          <AlertDescription>{copy.complianceNotice}</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog
        open={pendingIntent != null}
        onOpenChange={(open) => {
          if (!open) setPendingIntent(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.overrideConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{copy.overrideConfirm.description}</span>
              <span className="block text-foreground">
                {copy.complianceNotice}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.overrideConfirm.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingIntent) applyIntent(pendingIntent);
                setPendingIntent(null);
              }}
            >
              {copy.overrideConfirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockEmitirOpen} onOpenChange={setBlockEmitirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.blockEmitir.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.blockEmitir.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            {clientId ? (
              <Button asChild>
                <Link to={`/clients/${clientId}`} onClick={() => setBlockEmitirOpen(false)}>
                  {copy.blockEmitir.goToClient}
                </Link>
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
